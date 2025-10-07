import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { TRADE_SYMBOL } = process.env;

    const spotUrl = "https://api.bitget.com/api/spot/v1/market/tickers";
    const spotRes = await fetch(spotUrl);
    const spotData = await spotRes.json();
    const spot = spotData.data.find(s => s.symbol === `${TRADE_SYMBOL}_SPBL`);

    const futUrl = "https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl";
    const futRes = await fetch(futUrl);
    const futData = await futRes.json();
    const future = futData.data.find(f => f.symbol === `${TRADE_SYMBOL}_UMCBL`);

    const spread = ((future.last - spot.close) / spot.close) * 100;

    res.status(200).json({
      spot: spot.close,
      future: future.last,
      spread: spread.toFixed(3),
      symbol: TRADE_SYMBOL,
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
