import functions from '@google-cloud/functions-framework';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp();
}

const UHD_BASE = 'https://www.uhdnow.com';
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function setCors(res, req) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const reqOrigin = req.headers.origin;
  if (allowedOrigin === '*') {
    res.set('Access-Control-Allow-Origin', '*');
  } else {
    const origins = allowedOrigin.split(',').map((s) => s.trim()).filter(Boolean);
    if (reqOrigin && origins.includes(reqOrigin)) {
      res.set('Access-Control-Allow-Origin', reqOrigin);
      res.set('Vary', 'Origin');
    } else if (origins.length > 0) {
      res.set('Access-Control-Allow-Origin', origins[0]);
    }
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

function extractCookies(headers) {
  const raw = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : headers.get('set-cookie')
      ? [headers.get('set-cookie')]
      : [];
  return raw
    .map((line) => String(line).split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function fetchUhdJson(path, cookieHeader) {
  const res = await fetch(`${UHD_BASE}${path}`, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'application/json',
      Cookie: cookieHeader,
      Origin: UHD_BASE,
      Referer: `${UHD_BASE}/user`,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, status: res.status, raw: text.slice(0, 300) };
  }
}

functions.http('uhdProxy', async (req, res) => {
  setCors(res, req);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!idToken) {
      res.status(401).json({ error: 'Missing Firebase ID token' });
      return;
    }

    const decoded = await getAuth().verifyIdToken(idToken);
    if (adminEmail && decoded.email !== adminEmail) {
      res.status(403).json({ error: 'Forbidden: admin only' });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const totpCode = String(body.totp_code || '').trim();

    if (!username || !password) {
      res.status(400).json({ error: 'Missing username or password' });
      return;
    }

    const loginPayload = totpCode
      ? { username, password, totp_code: totpCode }
      : { username, password };

    const loginRes = await fetch(`${UHD_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BROWSER_UA,
        Origin: UHD_BASE,
        Referer: `${UHD_BASE}/login`,
      },
      body: JSON.stringify(loginPayload),
    });

    const loginJson = await loginRes.json().catch(() => null);
    if (!loginRes.ok || !loginJson?.ok) {
      res.status(401).json({
        ok: false,
        error: loginJson?.msg || loginJson?.error || `UHD login failed (HTTP ${loginRes.status})`,
      });
      return;
    }

    const cookieHeader = extractCookies(loginRes.headers);
    if (!cookieHeader) {
      res.status(502).json({ ok: false, error: 'UHD login succeeded but no session cookie returned' });
      return;
    }

    const [userRes, subRes, trafficRes, domainsRes] = await Promise.all([
      fetchUhdJson('/api/v1/users/me', cookieHeader),
      fetchUhdJson('/api/v1/subscriptions/me', cookieHeader),
      fetchUhdJson('/api/v1/traffic/me', cookieHeader),
      fetchUhdJson('/api/v1/subscriptions/domains', cookieHeader),
    ]);

    const domains = Array.isArray(domainsRes?.data) ? domainsRes.data : [];
    const embyBase = String(body.embyUrl || domains[0]?.domain || '').trim().replace(/\/+$/, '');
    let emby = null;

    if (embyBase) {
      try {
        const embyAuthRes = await fetch(`${embyBase}/emby/Users/AuthenticateByName`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': BROWSER_UA,
            'X-Emby-Authorization': 'MediaBrowser Client="SpaceToolbox", Device="Web", DeviceId="space-toolbox-web", Version="1.0.0"',
          },
          body: JSON.stringify({ Username: username, Pw: password }),
        });
        if (!embyAuthRes.ok) {
          throw new Error(`Emby HTTP ${embyAuthRes.status}`);
        }
        const embyAuth = await embyAuthRes.json();
        const embyToken = embyAuth?.AccessToken || '';
        const tokenQs = embyToken ? `?X-Emby-Token=${encodeURIComponent(embyToken)}` : '';
        const [infoRes, countsRes] = await Promise.allSettled([
          fetch(`${embyBase}/emby/System/Info${tokenQs}`, { headers: { 'User-Agent': BROWSER_UA } }).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`${embyBase}/emby/Items/Counts${tokenQs}`, { headers: { 'User-Agent': BROWSER_UA } }).then((r) =>
            r.ok ? r.json() : null
          ),
        ]);
        const info = infoRes.status === 'fulfilled' ? infoRes.value : null;
        const counts = countsRes.status === 'fulfilled' ? countsRes.value : null;
        emby = {
          ok: true,
          url: embyBase,
          serverName: info?.ServerName || 'Emby 在线',
          version: info?.Version || '',
          movieCount: counts?.MovieCount ?? null,
          seriesCount: counts?.SeriesCount ?? null,
        };
      } catch (embyErr) {
        emby = {
          ok: false,
          url: embyBase,
          error: embyErr?.message || 'Emby connection failed',
        };
      }
    }

    res.status(200).json({
      ok: true,
      user: userRes?.data || null,
      subscription: subRes?.data || null,
      traffic: trafficRes?.data || null,
      domains,
      emby,
    });
  } catch (err) {
    console.error('[uhdProxy] error:', err);
    res.status(500).json({ ok: false, error: err?.message || 'Internal error' });
  }
});
