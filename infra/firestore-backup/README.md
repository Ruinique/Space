# Firestore 定期快照导出与自动清理（GCS Bucket）

本目录配合 [.github/workflows/backup-firestore.yml](../../.github/workflows/backup-firestore.yml) 实现每周自动将 Firestore 数据导出到 Google Cloud Storage（GCS），并通过 [lifecycle.json](./lifecycle.json) 自动删除 **30 天前** 的旧快照，避免存储空间无限增长。

## 一次性初始化步骤

```bash
export PROJECT_ID="your-project-id"
export BUCKET_NAME="${PROJECT_ID}-firestore-backups"
export DEPLOYER_SA="github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# 1. 创建与 Firestore 同区域的 GCS Bucket（例如 us-central1，符合 5GB/月 Always Free 区域条件）
gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --project="$PROJECT_ID" \
  --location="us-central1" \
  --uniform-bucket-level-access

# 2. 绑定生命周期规则：自动删除 snapshots/ 下超过 30 天的对象
gcloud storage buckets update "gs://${BUCKET_NAME}" \
  --lifecycle-file=infra/firestore-backup/lifecycle.json

# 3. 授予 GitHub Actions 部署服务账号导出 Firestore 与管理该 Bucket 生命周期的权限
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/datastore.importExportAdmin"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/storage.admin"
```

## 启用 GitHub Actions 自动备份

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions -> Variables` 中添加：

- `FIRESTORE_BACKUP_BUCKET`: 填写上面创建的 `${BUCKET_NAME}`（不含 `gs://` 前缀）。

配置完成后，工作流会每周自动执行一次全量快照导出，并确保 GCS 自动清理超过 30 天的历史快照；也可以在 GitHub Actions 页面手动触发 `workflow_dispatch`。
