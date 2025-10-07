// api/trade.js
import ccxt from 'ccxt';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const LIVE = (process.env.LIVE_TRADING === 'true');
    if (!LIVE) {
      return res.status(403).json({ error: 'Live trading disabled. Set LIVE_TRADING=true in env to enable.' });
    }

    const key = process.env.BITGET_API_KEY;
    const secret = process.env.BITGET_API_SECRET;
    const passphrase = process.env.BITGET_API_PASSPHRASE || '';

    if (!key || !secret) {
      return res.status(400).json({ error: 'API keys missing' });
    }

    const { symbol = 'BTC/USDT', side, amount, marketType = 'spot' } = req.body || {};

    if (!side || !amount) return res.status(400).json({ error: 'side and amount required' });
    if (!['buy','sell'].includes(side)) return res.status(400).json({ error: 'side must be buy or sell' });

    // Setup exchange with ccxt
    const exchange = new ccxt.bitget({
      apiKey: key,
      secret,
      password: passphrase,
      enableRateLimit: true,
      options: { defaultType: marketType === 'spot' ? 'spot' : 'future' }
    });

    // Convert symbol format if needed (ccxt expects 'BTC/USDT')
    const sym = symbol.includes('/') ? symbol : symbol.slice(0, -4) + '/' + symbol.slice(-4);

    // Place a market order (note: futures params may vary — ccxt attempts to unify)
    let order;
    try {
      if (marketType === 'spot') {
        order = await exchange.createOrder(sym, 'market', side, parseFloat(amount));
      } else {
        // For futures: use market order; the symbol name in ccxt for Bitget futures may require exact contract id.
        order = await exchange.createOrder(sym, 'market', side, parseFloat(amount));
      }
    } catch (e) {
      console.error('order error', e);
      return res.status(500).json({ error: e.message || String(e) });
    }

    return res.json({ ok: true, order });
  } catch (err) {
    console.error('trade error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
