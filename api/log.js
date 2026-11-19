export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown';

  const b = req.body || {};

  const entry = {
    ts: Date.now(),
    ip,
    ua: b.ua || req.headers['user-agent'] || '',
    ref: b.ref || '',
    page: b.page || '',
    host: b.host || '',
    tz: b.tz || '',
    lang: b.lang || '',
    screen: b.screen || '',
    id: b.id || '',
    country: req.headers['x-vercel-ip-country'] || '',
    city: req.headers['x-vercel-ip-city'] || '',
    region: req.headers['x-vercel-ip-country-region'] || '',
    lat: req.headers['x-vercel-ip-latitude'] || '',
    lon: req.headers['x-vercel-ip-longitude'] || ''
  };

  console.log('[ghost]', JSON.stringify(entry));

  if (process.env.TG_TOKEN && process.env.TG_CHAT) {
    const msg =
      `🛰 ${entry.host}\n` +
      `👤 ${entry.ip} — ${entry.country}${entry.city ? '/' + entry.city : ''}\n` +
      `📄 ${entry.page}\n` +
      `🖥 ${entry.ua.slice(0, 120)}`;
    try {
      await fetch(
        `https://api.telegram.org/bot${process.env.TG_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TG_CHAT,
            text: msg,
            disable_web_page_preview: true
          })
        }
      );
    } catch (e) {}
  }

  return res.status(200).json({ ok: true });
}
