import functions from '@google-cloud/functions-framework';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) {
  initializeApp();
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ruiyizhan2003@gmail.com';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ruinique.com';
const DEFAULT_KOMARI_URL = process.env.KOMARI_DEFAULT_URL || 'https://komari.ruinique.com/api/nodes';
const ALLOWED_HOSTS = new Set(
  (process.env.ALLOWED_KOMARI_HOSTS || 'komari.ruinique.com')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

function setCors(res, reqOrigin) {
  const origin =
    reqOrigin === ALLOWED_ORIGIN || reqOrigin === 'http://localhost:4321'
      ? reqOrigin
      : ALLOWED_ORIGIN;
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Komari-Token');
}

functions.http('komariProxy', async (req, res) => {
  setCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const decoded = await getAuth().verifyIdToken(match[1]);
    if (!decoded.email || decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }

    const rawTarget = typeof req.query.url === 'string' && req.query.url.trim()
      ? req.query.url.trim()
      : DEFAULT_KOMARI_URL;

    let targetUrl;
    try {
      targetUrl = new URL(rawTarget);
    } catch {
      return res.status(400).json({ error: 'Invalid target URL' });
    }

    if (targetUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(targetUrl.hostname.toLowerCase())) {
      return res.status(403).json({ error: `Host not allowed: ${targetUrl.hostname}` });
    }

    const upstreamHeaders = {
      Accept: 'application/json',
    };
    const komariToken = req.headers['x-komari-token'];
    if (typeof komariToken === 'string' && komariToken.trim()) {
      upstreamHeaders['Authorization'] = `Bearer ${komariToken.trim()}`;
    }

    const upstreamRes = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: upstreamHeaders,
    });

    const text = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8';
    res.set('Content-Type', contentType);
    return res.status(upstreamRes.status).send(text);
  } catch (err) {
    console.error('[komariProxy] Error:', err);
    return res.status(502).json({
      error: err?.message || 'Upstream Komari request failed',
    });
  }
});
