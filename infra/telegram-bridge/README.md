# Telegram Channel → `/moments` 实时同步桥接

本目录提供一个轻量级 **Cloud Function (`telegramChannelWebhook`)**，用于接收 Telegram Bot 的 `channel_post` 与 `edited_channel_post` Webhook 推送，并自动写入 Firestore 的 `moments` 集合，实现“在 Telegram 频道发消息 / 编辑消息，博客 `/moments` 毫秒级同步更新”。

## 绑定步骤

1. 在 Telegram 中找到 `@BotFather`，发送 `/newbot` 创建一个 Bot，拿到 `BOT_TOKEN`。
2. 将你的 Bot 拉入目标 Telegram Channel，并设为 **管理员（Administrator）**。
3. 执行以下命令为 Bot 绑定 Webhook（替换 `<BOT_TOKEN>`、`<WEBHOOK_URL>` 和 `<WEBHOOK_SECRET>`）：
   ```bash
   curl -s "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -d "url=<WEBHOOK_URL>" \
     -d "secret_token=<WEBHOOK_SECRET>" \
     -d 'allowed_updates=["channel_post","edited_channel_post"]'
   ```
4. 绑定成功后，你在 Telegram 频道发送的任何文字消息都会自动同步到博客 `/moments`（如果消息以 `#TAG ` 开头，会自动提取为该条动态的标签）。
