// api/price.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const qsSymbol = req.query.symbol || 'BTC/USDT';
    // Accept symbol either like BTC/USDT or BTCUSDT
    const symbol = qsSymbol.includes('/') ? qsSymbol.replace('/', '') : qsSymbol;
    const type = (req.query.type || 'spot-future').toLowerCase(); // spot-spot, spot-future, future-future

    // Bitget endpoints (server-side fetch — no CORS)
    const spotUrl = `https://api.bitget.com/api/spot/v1/market/ticker?symbol=${symbol}`;
    // Bitget mix futures endpoint tends to return close/last in data
    const futUrl = `https://api.bitget.com/api/mix/v1/market/ticker?symbol=${symbol}`;

    let urlA, urlB;
    if (type === 'spot-spot') {
      urlA = spotUrl; urlB = spotUrl;
    } else if (type === 'spot-future') {
      urlA = spotUrl; urlB = futUrl;
    } else if (type === 'future-future') {
      urlA = futUrl; urlB = futUrl;
    } else {
      return res.status(400).json({ error: 'invalid type' });
    }

    const [rA, rB] = await Promise.all([fetch(urlA), fetch(urlB)]);
    const jA = await rA.json().catch(() => null);
    const jB = await rB.json().catch(() => null);

    const parsePrice = (j) => {
      if (!j) return null;
      const d = j.data || j;
      const last = parseFloat(d.last || d.close || d.lastPrice || (Array.isArray(d) && d[0]?.last));
      if (!isNaN(last)) return last;
      return null;
    };

    const pA = parsePrice(jA);
    const pB = parsePrice(jB);

    if (pA == null || pB == null) {
      return res.status(502).json({ error: 'failed to parse bitget response', pA, pB, jA, jB });
    }

    const abs = Math.abs(pA - pB);
    const pct = (abs / ((pA + pB) / 2)) * 100;

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      symbol,
      type,
      priceA: pA,
      priceB: pB,
      spreadAbs: Number(abs.toFixed(8)),
      spreadPct: Number(pct.toFixed(6)),
      ts: Date.now()
    });
  } catch (err) {
    console.error('price error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
