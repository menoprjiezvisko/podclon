export default async function handler(req, res) {
  try {
    const key = process.env.LISTENNOTES_KEY;
    if (!key) return res.status(500).json({ error: 'LISTENNOTES_KEY not configured on server' });

    // Build target URL: keep path and query after /api/listennotes
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace(/^\/api\/listennotes/, '') || '';
    const target = `https://listen-api.listennotes.com/api/v2${path}${url.search}`;

    const init = {
      method: req.method,
      headers: {
        'X-ListenAPI-Key': key,
        ...(req.headers.accept ? { 'Accept': req.headers.accept } : {}),
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // for Vercel, req.body is already parsed if content-type is json
      if (req.body && Object.keys(req.body).length) {
        init.body = JSON.stringify(req.body);
        init.headers['Content-Type'] = 'application/json';
      }
    }

    const r = await fetch(target, init);
    const contentType = r.headers.get('content-type') || 'application/json';
    const buffer = await r.arrayBuffer();

    res.status(r.status);
    res.setHeader('Content-Type', contentType);
    const clen = r.headers.get('content-length'); if (clen) res.setHeader('Content-Length', clen);
    res.send(Buffer.from(new Uint8Array(buffer)));
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).json({ error: err.message });
  }
}