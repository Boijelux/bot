let lastTrade = { time: null, spread: null, action: "none" };

export function updateTradeLog(spread, action) {
  lastTrade = { time: new Date().toISOString(), spread, action };
}

export default async function handler(req, res) {
  res.status(200).json(lastTrade);
}
