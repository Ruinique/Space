# Space UHDNOW Proxy (Cloud Function Gen2)

Lightweight proxy for `https://www.uhdnow.com` so the static `/tools` page can log in with your UHDNOW username/password and fetch remaining days, plan info, traffic usage, and Emby server domains without browser CORS issues.

## Security
- Verifies Firebase ID Token and checks `ADMIN_EMAIL` (`ruiyizhan2003@gmail.com`).
- Restricts CORS to `ALLOWED_ORIGIN` (`https://ruinique.com`).
- Stores zero credentials on the server; credentials are sent per-request from your admin-only Toolbox.

## Deploy
```bash
export PROJECT_ID="project-d5956722-3ab5-4c0f-be0"
gcloud functions deploy uhdProxy \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=uhdProxy --trigger-http --allow-unauthenticated \
  --set-env-vars="ADMIN_EMAIL=ruiyizhan2003@gmail.com,ALLOWED_ORIGIN=https://ruinique.com" \
  --project="$PROJECT_ID"
```
