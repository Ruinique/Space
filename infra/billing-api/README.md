# GCP 月度账单 API（BigQuery Billing Export + Cloud Function）

GCP 没有直接返回实时费用明细的 REST API；官方标准做法是开启 **Billing Export to BigQuery**（开启导出本身免费，BigQuery 每月有 1 TB 查询 + 10 GB 存储免费额度），再通过本 Cloud Function 按当前登录管理员的 Firebase ID Token 鉴权后查询当月各服务费用，并在博客 `/tools` 工作箱中直接展示。

## 启用步骤

### 1. 创建 BigQuery 数据集并开启账单导出

```bash
export PROJECT_ID="project-d5956722-3ab5-4c0f-be0"

gcloud services enable bigquery.googleapis.com cloudfunctions.googleapis.com run.googleapis.com --project="$PROJECT_ID"
bq --location=US mk --dataset "${PROJECT_ID}:billing_export"
```

然后在 GCP 控制台打开 **Billing -> Billing export -> BigQuery export**：
- 在 **Standard usage cost** 中选择刚才创建的 `billing_export` 数据集并保存（首次开启后通常数小时至 1 天内生成 `gcp_billing_export_v1_*` 表）。

### 2. 部署 Cloud Function

```bash
cd infra/billing-api
gcloud functions deploy getMonthlyBilling \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=. \
  --entry-point=getMonthlyBilling \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT=${PROJECT_ID},BILLING_DATASET=billing_export,ADMIN_EMAIL=ruiyizhan2003@gmail.com,ALLOWED_ORIGIN=https://ruinique.com" \
  --project="$PROJECT_ID"
```

> 说明：`--allow-unauthenticated` 仅用于允许浏览器发起跨域请求，函数内部会严格校验 `Authorization: Bearer <Firebase ID Token>` 且要求 `email === ADMIN_EMAIL`。

部署完成后，将输出的函数 URL 填入博客 `/tools` -> **GCP 月度账单** 中即可直接查看。
