// pages/api/telegram.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

interface AlertPayload {
  type: 'alert' | 'report' | 'signal';
  symbol?: string;
  message?: string;
  stocks?: Array<{
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    signal: string;
    score: number;
    candlePattern: string | null;
    rsi: number | null;
  }>;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function buildAlertMessage(payload: AlertPayload): string {
  if (payload.type === 'alert' && payload.symbol && payload.message) {
    return `🚨 *STOCK ALERT*\n\n*${escapeMarkdown(payload.symbol)}*\n${escapeMarkdown(payload.message)}\n\n_Powered by StockPro Screener_`;
  }

  if (payload.type === 'report' && payload.stocks) {
    const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let msg = `📊 *DAILY SCREENING REPORT*\n_${escapeMarkdown(date)}_\n\n`;

    const strongBuys = payload.stocks.filter(s => s.signal === 'STRONG_BUY');
    const buys = payload.stocks.filter(s => s.signal === 'BUY');
    const sells = payload.stocks.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL');

    if (strongBuys.length > 0) {
      msg += `🟢 *STRONG BUY \\(${strongBuys.length}\\)*\n`;
      strongBuys.slice(0, 5).forEach(s => {
        const change = s.changePercent >= 0 ? `+${s.changePercent.toFixed(2)}%` : `${s.changePercent.toFixed(2)}%`;
        msg += `• *${escapeMarkdown(s.symbol)}* \\- Score: ${s.score}/100 \\| ${escapeMarkdown(change)}\n`;
      });
      msg += '\n';
    }

    if (buys.length > 0) {
      msg += `🔵 *BUY \\(${buys.length}\\)*\n`;
      buys.slice(0, 5).forEach(s => {
        const change = s.changePercent >= 0 ? `+${s.changePercent.toFixed(2)}%` : `${s.changePercent.toFixed(2)}%`;
        msg += `• *${escapeMarkdown(s.symbol)}* \\- Score: ${s.score}/100 \\| ${escapeMarkdown(change)}\n`;
      });
      msg += '\n';
    }

    if (sells.length > 0) {
      msg += `🔴 *SELL/AVOID \\(${sells.length}\\)*\n`;
      sells.slice(0, 5).forEach(s => {
        msg += `• *${escapeMarkdown(s.symbol)}* \\- Score: ${s.score}/100\n`;
      });
      msg += '\n';
    }

    msg += `_StockPro Screener \\- ${new Date().toLocaleTimeString('id-ID')}_`;
    return msg;
  }

  if (payload.type === 'signal' && payload.stocks && payload.stocks.length > 0) {
    const s = payload.stocks[0];
    const emoji = s.signal === 'STRONG_BUY' ? '🚀' : s.signal === 'BUY' ? '🟢' : s.signal === 'STRONG_SELL' ? '🔴' : s.signal === 'SELL' ? '🟠' : '⚪';
    const change = s.changePercent >= 0 ? `+${s.changePercent.toFixed(2)}%` : `${s.changePercent.toFixed(2)}%`;
    
    return `${emoji} *SIGNAL: ${escapeMarkdown(s.signal.replace('_', ' '))}*\n\n` +
      `*${escapeMarkdown(s.symbol)}* \\- ${escapeMarkdown(s.name)}\n\n` +
      `💰 Harga: *${escapeMarkdown(s.price.toLocaleString('id-ID'))}*\n` +
      `📈 Perubahan: *${escapeMarkdown(change)}*\n` +
      `🎯 Score: *${s.score}/100*\n` +
      `📊 RSI: *${s.rsi !== null ? s.rsi.toFixed(1) : 'N/A'}*\n` +
      `🕯️ Pola: *${escapeMarkdown(s.candlePattern || 'Tidak terdeteksi')}*\n\n` +
      `_StockPro Screener_`;
  }

  return escapeMarkdown(payload.message || 'Notification from StockPro Screener');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = req.body.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || botToken === 'your_bot_token_here') {
    return res.status(400).json({ error: 'Telegram bot token not configured. Please set TELEGRAM_BOT_TOKEN in environment variables.' });
  }

  if (!chatId || chatId === 'your_chat_id_here') {
    return res.status(400).json({ error: 'Telegram chat ID not configured. Please set TELEGRAM_CHAT_ID in environment variables.' });
  }

  try {
    const payload: AlertPayload = req.body;
    const messageText = buildAlertMessage(payload);

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return res.status(400).json({ error: data.description || 'Telegram API error', details: data });
    }

    return res.status(200).json({ success: true, messageId: data.result?.message_id });
  } catch (error) {
    console.error('Telegram send error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
