# SubHub — 轻量级订阅聚合与流量监控（Cloud Function）

替代重型 Xboard 的极简订阅分发与流量监控服务：
- **上游聚合与流量解析**：拉取多个上游订阅，解析 `Subscription-Userinfo`（已用流量、总流量、到期时间）与节点列表。
- **订阅下发**：通过 `?token=<subToken>&format=base64|raw` 输出聚合后的通用 Base64 / 明文节点订阅，并合并 `Subscription-Userinfo` 响应头。
- **隐私安全**：上游订阅链接与 `subToken` 保存在你私有的 Firestore `admin_settings/toolbox` 中，不会写进公开 GitHub 仓库。

## 部署命令（Cloud Shell）

```bash
export PROJECT_ID="project-d5956722-3ab5-4c0f-be0"
rm -rf /tmp/space-subhub && git clone --depth=1 https://github.com/Ruinique/Space.git /tmp/space-subhub
cd /tmp/space-subhub/infra/sub-hub

gcloud functions deploy subHub \
  --gen2 --runtime=nodejs22 --region=us-central1 \
  --source=. --entry-point=subHub --trigger-http --allow-unauthenticated \
  --set-env-vars="ADMIN_EMAIL=ruiyizhan2003@gmail.com,ALLOWED_ORIGIN=https://ruinique.com" \
  --project="$PROJECT_ID"
```

> 确保 `622762685869-compute@developer.gserviceaccount.com` 拥有 `roles/datastore.user`（前面 Cloud Shell 输出显示已具备）。
