const functions = require('@google-cloud/functions-framework');
const { Firestore, FieldValue } = require('@google-cloud/firestore');

const db = new Firestore();
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHANNEL_ID || '';

/**
 * Telegram Bot Webhook receiver.
 * Syncs channel_post & edited_channel_post from a Telegram Channel
 * directly into Firestore `moments/` for real-time display on /moments.
 */
functions.http('telegramChannelWebhook', async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (WEBHOOK_SECRET) {
    const incomingSecret = req.get('x-telegram-bot-api-secret-token') || '';
    if (incomingSecret !== WEBHOOK_SECRET) {
      res.status(403).send('Forbidden');
      return;
    }
  }

  const update = req.body || {};
  const post = update.channel_post || update.edited_channel_post;

  if (!post || !post.chat) {
    res.status(200).json({ ok: true, skipped: 'not_a_channel_post' });
    return;
  }

  const chatId = String(post.chat.id);
  if (ALLOWED_CHAT_ID && chatId !== ALLOWED_CHAT_ID) {
    res.status(200).json({ ok: true, skipped: 'unauthorized_chat' });
    return;
  }

  const rawText = (post.text || post.caption || '').trim();
  if (!rawText) {
    res.status(200).json({ ok: true, skipped: 'empty_text' });
    return;
  }

  // Optional leading #TAG extraction, e.g. "#CUDA Warp shuffle notes..."
  let tag = 'TELEGRAM';
  let content = rawText;
  const tagMatch = rawText.match(/^#([A-Za-z0-9_-]{2,20})\s+([\s\S]+)$/);
  if (tagMatch) {
    tag = tagMatch[1].toUpperCase();
    content = tagMatch[2].trim();
  }

  const docId = `tg_${chatId.replace('-', 'm')}_${post.message_id}`;
  const docRef = db.collection('moments').doc(docId);

  const payload = {
    tag,
    content,
    source: 'telegram',
    tgChannelTitle: post.chat.title || '',
    tgChannelUsername: post.chat.username || '',
    tgMessageId: post.message_id,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (update.channel_post) {
    payload.createdAt = post.date ? new Date(post.date * 1000) : FieldValue.serverTimestamp();
  }

  await docRef.set(payload, { merge: true });
  res.status(200).json({ ok: true, docId });
});
