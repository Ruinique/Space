import functions from '@google-cloud/functions-framework';
import { BigQuery } from '@google-cloud/bigquery';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (getApps().length === 0) {
  initializeApp();
}

const bigquery = new BigQuery();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ruiyizhan2003@gmail.com';
const PROJECT_ID = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
const BILLING_DATASET = process.env.BILLING_DATASET || 'billing_export';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://ruinique.com';

function setCors(res, reqOrigin) {
  const origin =
    reqOrigin === ALLOWED_ORIGIN || reqOrigin === 'http://localhost:4321'
      ? reqOrigin
      : ALLOWED_ORIGIN;
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

functions.http('getMonthlyBilling', async (req, res) => {
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

    if (!PROJECT_ID) {
      return res.status(500).json({ error: 'GCP_PROJECT env var not configured' });
    }

    const query = `
      SELECT
        service.description AS service,
        currency,
        ROUND(SUM(cost), 4) AS gross_cost,
        ROUND(SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)), 4) AS credits,
        ROUND(SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)), 4) AS net_cost
      FROM \`${PROJECT_ID}.${BILLING_DATASET}.gcp_billing_export_v1_*\`
      WHERE project.id = @projectId
        AND invoice.month = FORMAT_DATE('%Y%m', CURRENT_DATE())
      GROUP BY service, currency
      ORDER BY net_cost DESC, gross_cost DESC
    `;

    const [rows] = await bigquery.query({
      query,
      params: { projectId: PROJECT_ID },
    });

    const currency = rows[0]?.currency || 'USD';
    let grossTotal = 0;
    let creditsTotal = 0;
    let netTotal = 0;

    const services = rows.map((r) => {
      const gross = Number(r.gross_cost || 0);
      const credits = Number(r.credits || 0);
      const net = Number(r.net_cost || 0);
      grossTotal += gross;
      creditsTotal += credits;
      netTotal += net;
      return {
        service: r.service || 'Other',
        currency: r.currency || currency,
        grossCost: gross,
        credits,
        netCost: net,
      };
    });

    return res.status(200).json({
      projectId: PROJECT_ID,
      month: new Date().toISOString().slice(0, 7),
      currency,
      grossTotal: Number(grossTotal.toFixed(4)),
      creditsTotal: Number(creditsTotal.toFixed(4)),
      netTotal: Number(netTotal.toFixed(4)),
      services,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[getMonthlyBilling] Error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to query BigQuery billing export',
    });
  }
});
