import crypto from 'node:crypto';
import functions from '@google-cloud/functions-framework';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import yaml from 'js-yaml';

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ruiyizhan2003@gmail.com';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ruinique.com';

const PROXY_SCHEMES = [
  'vless://',
  'vmess://',
  'trojan://',
  'ss://',
  'ssr://',
  'hysteria2://',
  'hy2://',
  'hysteria://',
  'tuic://',
  'socks://',
  'socks5://',
];

function setCors(res, reqOrigin) {
  const origin =
    reqOrigin === ALLOWED_ORIGIN || reqOrigin === 'http://localhost:4321'
      ? reqOrigin
      : ALLOWED_ORIGIN;
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function parseUserInfoHeader(headerVal) {
  if (!headerVal || typeof headerVal !== 'string') return null;
  const info = { upload: 0, download: 0, total: 0, expire: 0 };
  let found = false;
  for (const part of headerVal.split(';')) {
    const [rawK, rawV] = part.split('=').map((s) => s.trim());
    if (!rawK || !rawV) continue;
    const num = Number(rawV);
    if (!Number.isFinite(num)) continue;
    if (rawK === 'upload' || rawK === 'download' || rawK === 'total' || rawK === 'expire') {
      info[rawK] = num;
      found = true;
    }
  }
  return found ? info : null;
}

function tryDecodeBase64(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes('://') || trimmed.includes('proxies:')) {
    return trimmed;
  }
  const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    if (PROXY_SCHEMES.some((s) => decoded.includes(s))) {
      return decoded;
    }
  } catch {
    // not base64
  }
  return trimmed;
}

function extractNodeLabel(uri) {
  const hashIdx = uri.indexOf('#');
  if (hashIdx !== -1) {
    try {
      return decodeURIComponent(uri.slice(hashIdx + 1).trim());
    } catch {
      return uri.slice(hashIdx + 1).trim();
    }
  }
  if (uri.startsWith('vmess://')) {
    try {
      const json = JSON.parse(Buffer.from(uri.slice(8), 'base64').toString('utf8'));
      if (json?.ps) return String(json.ps);
    } catch {
      // ignore
    }
  }
  return uri.slice(0, 32);
}

function parseSubscriptionBody(rawText) {
  const decoded = tryDecodeBase64(rawText);
  const lines = decoded
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && PROXY_SCHEMES.some((s) => l.startsWith(s)));

  if (lines.length > 0) {
    return {
      uris: lines,
      names: lines.map(extractNodeLabel),
    };
  }

  // Fallback: Clash YAML proxies list
  try {
    const doc = yaml.load(decoded);
    if (doc && Array.isArray(doc.proxies)) {
      const names = doc.proxies.map((p) => String(p?.name || p?.server || 'proxy'));
      return { uris: [], names, clashProxies: doc.proxies };
    }
  } catch {
    // not yaml
  }

  return { uris: [], names: [] };
}

async function fetchUpstream(item) {
  const url = String(item?.url || '').trim();
  const label = String(item?.name || url).trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { name: label, url, ok: false, error: 'Invalid URL', userinfo: null, uris: [], names: [] };
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'clash-verge/v2.0.0',
        Accept: '*/*',
      },
      signal: AbortSignal.timeout(12000),
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        name: label,
        url,
        ok: false,
        error: `HTTP ${res.status}`,
        userinfo: null,
        uris: [],
        names: [],
      };
    }

    const userinfo = parseUserInfoHeader(res.headers.get('subscription-userinfo'));
    const parsed = parseSubscriptionBody(text);
    return {
      name: label,
      url,
      ok: true,
      userinfo,
      uris: parsed.uris,
      names: parsed.names,
      nodeCount: parsed.uris.length || parsed.names.length,
    };
  } catch (err) {
    return {
      name: label,
      url,
      ok: false,
      error: err?.message || 'Fetch failed',
      userinfo: null,
      uris: [],
      names: [],
      nodeCount: 0,
    };
  }
}

function safeTokenEqual(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

functions.http('subHub', async (req, res) => {
  setCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  // Mode 1: Subscription Dispense Endpoint (?token=xxx&format=base64|raw)
  if (req.method === 'GET' && typeof req.query.token === 'string' && req.query.token.trim()) {
    try {
      const snap = await db.doc('admin_settings/toolbox').get();
      const subCfg = snap.exists ? snap.data()?.subHub : null;
      if (!subCfg?.subToken || !safeTokenEqual(req.query.token.trim(), subCfg.subToken)) {
        return res.status(403).send('Forbidden: invalid subscription token');
      }

      const upstreams = Array.isArray(subCfg.upstreams)
        ? subCfg.upstreams.filter((u) => u && u.enabled !== false && u.url)
        : [];
      const results = await Promise.all(upstreams.map(fetchUpstream));

      const allUris = [];
      let sumUp = 0;
      let sumDown = 0;
      let sumTotal = 0;
      let minExpire = 0;

      for (const r of results) {
        if (r.ok) {
          allUris.push(...r.uris);
          if (r.userinfo) {
            sumUp += r.userinfo.upload || 0;
            sumDown += r.userinfo.download || 0;
            sumTotal += r.userinfo.total || 0;
            if (r.userinfo.expire > 0 && (minExpire === 0 || r.userinfo.expire < minExpire)) {
              minExpire = r.userinfo.expire;
            }
          }
        }
      }

      if (typeof subCfg.customNodes === 'string' && subCfg.customNodes.trim()) {
        const customParsed = parseSubscriptionBody(subCfg.customNodes);
        allUris.push(...customParsed.uris);
      }

      if (sumTotal > 0 || sumUp > 0 || sumDown > 0) {
        res.set(
          'Subscription-Userinfo',
          `upload=${sumUp}; download=${sumDown}; total=${sumTotal}; expire=${minExpire}`
        );
      }
      res.set('Profile-Update-Interval', '6');

      const rawOutput = allUris.join('\n');
      const format = String(req.query.format || 'base64').toLowerCase();
      if (format === 'raw' || format === 'text') {
        res.set('Content-Type', 'text/plain; charset=utf-8');
        return res.status(200).send(rawOutput);
      }

      res.set('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(Buffer.from(rawOutput, 'utf8').toString('base64'));
    } catch (err) {
      console.error('[subHub] Dispense error:', err);
      return res.status(500).send('Failed to build subscription');
    }
  }

  // Mode 2: Admin Traffic & Node Inspector (requires Firebase Admin ID Token)
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

    let upstreams = [];
    if (req.method === 'POST' && Array.isArray(req.body?.upstreams)) {
      upstreams = req.body.upstreams;
    } else {
      const snap = await db.doc('admin_settings/toolbox').get();
      upstreams = snap.exists && Array.isArray(snap.data()?.subHub?.upstreams)
        ? snap.data().subHub.upstreams
        : [];
    }

    const results = await Promise.all(upstreams.map(fetchUpstream));
    return res.status(200).json({
      upstreams: results.map(({ uris: _uris, ...rest }) => rest),
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[subHub] Admin inspect error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
});
