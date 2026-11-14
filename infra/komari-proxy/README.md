# Komari CORS 代理（Cloud Function）

用于在浏览器端 `https://ruinique.com/tools` 安全拉取 `https://komari.ruinique.com/api/...` 数据并按 Space 风格渲染节点卡片，同时绕开浏览器 CORS 限制。

- 仅允许携带有效 **Firebase ID Token** 且邮箱为 `ADMIN_EMAIL` 的请求。
- 默认仅允许代理白名单域名（`ALLOWED_KOMARI_HOSTS=komari.ruinique.com`），防止 SSRF。

## 部署命令（Cloud Shell）

```bash
export PROJECT_ID="project-d5956722-3ab5-4c0f-be0"
cd /tmp/space-billing/infra/komari-proxy

gcloud functions deploy komariProxy \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=. \
  --entry-point=komariProxy \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="ADMIN_EMAIL=ruiyizhan2003@gmail.com,ALLOWED_ORIGIN=https://ruinique.com,ALLOWED_KOMARI_HOSTS=komari.ruinique.com" \
  --project="$PROJECT_ID"
```

部署完成后，将函数 URL 填入 `/tools` → **Komari 探针监控** → **配置** → **代理接口 URL** 即可。
