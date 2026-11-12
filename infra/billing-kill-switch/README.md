# GCP 账单预算与自动熔断开关（Billing Kill Switch）

本目录提供一套基于 **Cloud Billing Budget + Pub/Sub + Cloud Functions** 的自动熔断方案：当月度累计消费达到或超过 **$15 USD** 时，自动解除当前 GCP 项目的结算账号绑定（`billingAccountName: ""`），彻底阻断极端流量攻击或配置失误导致的超额扣费。

> 注意：如果你当前使用的是 Firebase **Spark 免费套餐**（未绑定活跃结算账号），本项目天然不会产生任何费用；当你未来升级到 Blaze 按量付费套餐并绑定结算账号后，建议立即部署本熔断脚本。

## 部署前置条件

1. 已绑定活跃的 GCP Billing Account。
2. 开启以下 API：
   ```bash
   gcloud services enable \
     cloudfunctions.googleapis.com \
     cloudbuild.googleapis.com \
     pubsub.googleapis.com \
     cloudbilling.googleapis.com \
     billingbudgets.googleapis.com
   ```

## 一键部署步骤

```bash
export PROJECT_ID="$(gcloud config get-value project)"
export TOPIC_NAME="billing-budget-alerts"
export REGION="us-central1"

# 1. 创建 Pub/Sub 主题
gcloud pubsub topics create "$TOPIC_NAME" --project="$PROJECT_ID"

# 2. 部署熔断 Cloud Function
gcloud functions deploy killBillingOnBudget \
  --gen2 \
  --runtime=nodejs22 \
  --region="$REGION" \
  --source=. \
  --entry-point=killBillingOnBudget \
  --trigger-topic="$TOPIC_NAME" \
  --set-env-vars="GCP_PROJECT=$PROJECT_ID,HARD_CAP_USD=15" \
  --project="$PROJECT_ID"
```

## 权限配置（关键）

部署完成后，Cloud Function 所使用的服务账号（默认是 `<PROJECT_NUMBER>-compute@developer.gserviceaccount.com` 或自定义 SA）需要拥有 **Billing Account Administrator**（`roles/billing.admin`）或 **Project Billing Manager**（`roles/billing.projectManager`）权限，才能执行解绑操作：

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/billing.projectManager"
```

## 在控制台绑定预算告警

前往 **GCP Console -> Billing -> Budgets & alerts -> Create budget**：
1. 范围选择本项目（`$PROJECT_ID`），金额设为 **$15 USD**。
2. 阈值告警建议设为 `50%`、`80%`、`100%`。
3. 在 **Manage notifications -> Connect a Pub/Sub topic to this budget** 中选择 `projects/$PROJECT_ID/topics/billing-budget-alerts`。
