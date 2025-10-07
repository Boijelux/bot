// api/validate.js
import ccxt from 'ccxt';

export default async function handler(req, res) {
  try {
    const key = process.env.BITGET_API_KEY;
    const secret = process.env.BITGET_API_SECRET;
    const passphrase = process.env.BITGET_API_PASSPHRASE || '';

    if (!key || !secret) {
      return res.status(400).json({ ok: false, error: 'API keys not configured in environment' });
    }

    // Create ccxt bitget instance for unified API
    const exchange = new ccxt.bitget({
      apiKey: key,
      secret,
      password: passphrase,
      enableRateLimit: true,
      options: { defaultType: 'spot' }
    });

    // Try a safe call: fetchBalance (read-only). If it's allowed, keys are valid.
    let result;
    try {
      result = await exchange.fetchBalance();
    } catch (e) {
      // Some keys may be restricted; return the error message (do not include secret)
      return res.status(403).json({ ok: false, error: e.message || String(e) });
    }

    // Basic sanity: ensure minimal structure in response
    const has = result && (result.info || result.free || result.total);
    return res.json({ ok: true, message: 'API keys validated (read permitted)', summary: has ? 'balance-fetched' : 'unknown' });
  } catch (err) {
    console.error('validate error', err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
