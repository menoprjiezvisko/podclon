const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async function(event, context) {
  const key = process.env.LISTENNOTES_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'LISTENNOTES_KEY not configured' }) };

  const path = event.path.replace(/^\/.netlify\/functions\/listennotes/, '') || '';
  const qs = event.queryStringParameters ? ('?' + new URLSearchParams(event.queryStringParameters).toString()) : '';
  const target = `https://listen-api.listennotes.com/api/v2${path}${qs}`;

  try {
    const r = await fetch(target, { headers: { 'X-ListenAPI-Key': key } });
    const text = await r.text();
    return {
      statusCode: r.status,
      headers: { 'Content-Type': r.headers.get('content-type') || 'text/plain' },
      body: text
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};