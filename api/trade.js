import crypto from "crypto";
import fetch from "node-fetch";

const { BITGET_API_KEY, BITGET_API_SECRET, BITGET_PASSPHRASE, TRADE_SYMBOL, TRADE_AMOUNT, SPREAD_TRIGGER } = process.env;

async function signRequest(method, path, body = "") {
  const timestamp = Date.now().toString();
  const content = timestamp + method + path + body;
  const sign = crypto.createHmac("sha256", BITGET_API_SECRET).update(content).digest("base64");
  return { timestamp, sign };
}

export default async function handler(req, res) {
  try {
    // Get current prices
    const [spotRes, futRes] = await Promise.all([
      fetch("https://api.bitget.com/api/spot/v1/market/tickers").then(r => r.json()),
      fetch("https://api.bitget.com/api/mix/v1/market/tickers?productType=umcbl").then(r => r.json())
    ]);
    const spot = spotRes.data.find(s => s.symbol === `${TRADE_SYMBOL}_SPBL`);
    const future = futRes.data.find(f => f.symbol === `${TRADE_SYMBOL}_UMCBL`);

    const spread = ((future.last - spot.close) / spot.close) * 100;
    console.log("Spread:", spread);

    if (spread > SPREAD_TRIGGER) {
      const path = "/api/spot/v1/trade/orders";
      const body = JSON.stringify({
        symbol: `${TRADE_SYMBOL}_SPBL`,
        side: "buy",
        orderType: "market",
        force: "gtc",
        size: TRADE_AMOUNT.toString()
      });

      const { timestamp, sign } = await signRequest("POST", path, body);

      const headers = {
        "ACCESS-KEY": BITGET_API_KEY,
        "ACCESS-SIGN": sign,
        "ACCESS-PASSPHRASE": BITGET_PASSPHRASE,
        "ACCESS-TIMESTAMP": timestamp,
        "Content-Type": "application/json"
      };

      const orderRes = await fetch(`https://api.bitget.com${path}`, {
        method: "POST",
        headers,
        body
      });

      const result = await orderRes.json();
      return res.status(200).json({
        status: "Executed BUY (Spot)",
        spread,
        order: result
      });
    }

    return res.status(200).json({ status: "No trade - spread too low", spread });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
