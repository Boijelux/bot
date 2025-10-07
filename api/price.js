// api/price.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  const symbol = (req.query.symbol || "BTCUSDT").toUpperCase();
  const type = req.query.type || "spot-future"; // spot-spot, spot-future, future-future

  try {
    // Bitget endpoints
    const spotUrl = `https://api.bitget.com/api/spot/v1/market/ticker?symbol=${symbol}`;
    const futUrl = `https://api.bitget.com/api/mix/v1/market/ticker?symbol=${symbol}_UMCBL`;

    let urls = [];
    if (type === "spot-spot") urls = [spotUrl, spotUrl];
    else if (type === "spot-future") urls = [spotUrl, futUrl];
    else if (type === "future-future") urls = [futUrl, futUrl];
    else {
      res.status(400).json({ error: "Invalid type" });
      return;
    }

    const [rA, rB] = await Promise.all(urls.map((u) => fetch(u).then((r) => r.json())));

    const pA =
      parseFloat(rA.data?.last || rA.data?.close || rA.data?.price) || null;
    const pB =
      parseFloat(rB.data?.last || rB.data?.close || rB.data?.price) || null;

    if (!pA || !pB) {
      res.status(500).json({ error: "Failed to get valid prices", rA, rB });
      return;
    }

    const abs = Math.abs(pA - pB);
    const pct = (abs / ((pA + pB) / 2)) * 100;

    res.status(200).json({
      symbol,
      type,
      marketA: urls[0],
      marketB: urls[1],
      priceA: pA,
      priceB: pB,
      spreadAbs: abs,
      spreadPct: pct.toFixed(4),
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown error" });
  }
}
