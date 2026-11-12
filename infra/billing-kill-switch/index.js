const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');

const PROJECT_ID = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const HARD_CAP_USD = Number(process.env.HARD_CAP_USD || 15);

/**
 * Listens to Cloud Billing Budget Pub/Sub notifications.
 * When costAmount >= HARD_CAP_USD (default $15), unlinks the billing account
 * from the project to prevent runaway charges.
 */
functions.cloudEvent('killBillingOnBudget', async (cloudEvent) => {
  const pubsubMessage = cloudEvent.data?.message;
  if (!pubsubMessage?.data) {
    console.log('No Pub/Sub payload received.');
    return;
  }

  const decoded = Buffer.from(pubsubMessage.data, 'base64').toString('utf8');
  const budgetData = JSON.parse(decoded);

  const costAmount = Number(budgetData.costAmount ?? 0);
  const budgetAmount = Number(budgetData.budgetAmount ?? HARD_CAP_USD);
  const currency = budgetData.currencyCode || 'USD';

  console.log(
    `[BillingWatch] Project=${PROJECT_ID} Cost=${costAmount} ${currency}, Budget=${budgetAmount} ${currency}, Cap=${HARD_CAP_USD} USD`
  );

  if (costAmount < HARD_CAP_USD) {
    console.log('Spend is below hard cap. No action taken.');
    return;
  }

  if (!PROJECT_ID) {
    throw new Error('GCP_PROJECT / GOOGLE_CLOUD_PROJECT environment variable is missing.');
  }

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-billing'],
  });
  const client = await auth.getClient();
  const url = `https://cloudbilling.googleapis.com/v1/projects/${PROJECT_ID}/billingInfo`;

  const currentRes = await client.request({ url, method: 'GET' });
  if (!currentRes.data?.billingEnabled) {
    console.log('Billing is already disabled on this project.');
    return;
  }

  await client.request({
    url,
    method: 'PUT',
    data: {
      billingAccountName: '',
    },
  });

  console.warn(
    `[KILL SWITCH TRIGGERED] Unlinked billing account from ${PROJECT_ID} (cost=${costAmount} ${currency} >= ${HARD_CAP_USD} USD).`
  );
});
