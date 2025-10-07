// api/proxy.js
// Simple proxy to fetch public Bitget endpoints server-side to avoid CORS problems.
// Usage: /api/proxy?url=https%3A%2F%2Fapi.bitget.com%2F...
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const url = req.query.url || req.url?.replace('/api/proxy?url=', '');
  if (!url) {
    res.status(400).json({ error: 'missing url param' });
    return;
  }

  try {
    // Basic whitelist: allow bitget only
    const allowedHost = ['api.bitget.com'];
    const u = new URL(url);
    if (!allowedHost.includes(u.hostname)) {
      res.status(403).json({ error: 'host not allowed' });
      return;
    }

    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Proxy',
        'Accept': 'application/json'
      },
      // no cache to ensure fresh data
    });

    const text = await r.text();
    // attempt to parse JSON, else send raw
    try {
      const json = JSON.parse(text);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(json);
    } catch (e) {
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(text);
    }
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
}
