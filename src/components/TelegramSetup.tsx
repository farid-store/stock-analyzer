// components/TelegramSetup.tsx
import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Bot, Info } from 'lucide-react';
import { useStore } from '../lib/store';

export default function TelegramSetup() {
  const { telegramConfig, setTelegramConfig, screenerResults } = useStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [reportSending, setReportSending] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alert',
          chatId: telegramConfig.chatId || undefined,
          symbol: 'TEST',
          message: '🎉 Koneksi berhasil! StockPro Screener telah terhubung ke bot Telegram Anda. Anda akan menerima notifikasi sinyal saham di sini.',
        }),
      });
      const data = await res.json();
      setTestResult({ success: !!data.success, message: data.success ? 'Pesan test berhasil terkirim!' : data.error || 'Gagal mengirim' });
    } catch (e) {
      setTestResult({ success: false, message: 'Error koneksi' });
    } finally {
      setTesting(false);
    }
  };

  const sendDailyReport = async () => {
    setReportSending(true);
    try {
      const topStocks = screenerResults.slice(0, 15).map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        signal: s.signal,
        score: s.score,
        rsi: s.indicators.rsi,
        candlePattern: s.candlePattern?.name || null,
      }));

      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'report',
          chatId: telegramConfig.chatId || undefined,
          stocks: topStocks,
        }),
      });
      const data = await res.json();
      setTestResult({ success: !!data.success, message: data.success ? 'Laporan harian berhasil dikirim!' : data.error || 'Gagal mengirim laporan' });
    } catch (e) {
      setTestResult({ success: false, message: 'Error mengirim laporan' });
    } finally {
      setReportSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Space Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#e8f4f8', marginBottom: '6px' }}>Integrasi Telegram Bot</h2>
        <p style={{ fontSize: '13px', color: '#7a9bb5', lineHeight: 1.6 }}>
          Hubungkan StockPro dengan bot Telegram Anda untuk menerima notifikasi sinyal, laporan harian, dan alert secara real-time langsung di HP Anda.
        </p>
      </div>

      {/* Setup Guide */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(163,255,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Info size={14} color="#a3ff00" />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#a3ff00', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cara Setup</span>
        </div>
        <ol style={{ paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { step: '01', text: 'Buka Telegram dan cari @BotFather' },
            { step: '02', text: 'Ketik /newbot dan ikuti instruksi untuk membuat bot baru' },
            { step: '03', text: 'Salin BOT TOKEN yang diberikan BotFather' },
            { step: '04', text: 'Mulai chat dengan bot Anda, lalu cari @userinfobot untuk mendapatkan Chat ID' },
            { step: '05', text: 'Masukkan token dan chat ID di form di bawah, lalu test koneksi' },
          ].map(item => (
            <li key={item.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#a3ff00', background: 'rgba(163,255,0,0.1)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '2px' }}>{item.step}</span>
              <span style={{ fontSize: '13px', color: '#7a9bb5', lineHeight: 1.5 }}>{item.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Config Form */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#3d5a73', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>Konfigurasi Bot</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#7a9bb5', marginBottom: '6px', fontFamily: 'Space Mono, monospace' }}>
              Bot Token <span style={{ color: '#ff3366' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
              value={telegramConfig.botToken}
              onChange={e => setTelegramConfig({ botToken: e.target.value })}
            />
            <p style={{ fontSize: '11px', color: '#3d5a73', marginTop: '4px' }}>
              Atau set via environment variable: TELEGRAM_BOT_TOKEN
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#7a9bb5', marginBottom: '6px', fontFamily: 'Space Mono, monospace' }}>
              Chat ID <span style={{ color: '#ff3366' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="-1001234567890 atau 987654321"
              value={telegramConfig.chatId}
              onChange={e => setTelegramConfig({ chatId: e.target.value })}
            />
            <p style={{ fontSize: '11px', color: '#3d5a73', marginTop: '4px' }}>
              Chat ID pribadi (positif) atau grup/channel (negatif). Atau set via TELEGRAM_CHAT_ID
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(163,255,0,0.04)', borderRadius: '8px', border: '1px solid rgba(163,255,0,0.1)' }}>
            <button
              onClick={() => setTelegramConfig({ enabled: !telegramConfig.enabled })}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                background: telegramConfig.enabled ? '#a3ff00' : 'rgba(163,255,0,0.15)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: telegramConfig.enabled ? '20px' : '3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: telegramConfig.enabled ? '#020408' : '#7a9bb5',
                transition: 'all 0.2s',
              }} />
            </button>
            <div>
              <span style={{ fontSize: '13px', color: '#e8f4f8', display: 'block' }}>Aktifkan Notifikasi</span>
              <span style={{ fontSize: '11px', color: '#7a9bb5' }}>Kirim alert otomatis saat sinyal kuat terdeteksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button onClick={sendTest} disabled={testing} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={14} />
          {testing ? 'Mengirim...' : 'Test Koneksi'}
        </button>
        <button onClick={sendDailyReport} disabled={reportSending || screenerResults.length === 0} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Send size={14} />
          {reportSending ? 'Mengirim...' : 'Kirim Laporan Harian'}
        </button>
      </div>

      {testResult && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: testResult.success ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,102,0.08)',
          border: `1px solid ${testResult.success ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)'}`,
          animation: 'fadeUp 0.3s ease-out',
        }}>
          {testResult.success ? <CheckCircle size={16} color="#00ff88" /> : <AlertCircle size={16} color="#ff3366" />}
          <span style={{ fontSize: '13px', color: testResult.success ? '#00ff88' : '#ff3366', fontFamily: 'Space Mono, monospace' }}>
            {testResult.message}
          </span>
        </div>
      )}

      {/* Alert Types */}
      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#3d5a73', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>Jenis Notifikasi</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { icon: '🚀', title: 'STRONG BUY Signal', desc: 'Score ≥ 75' },
            { icon: '📊', title: 'Laporan Harian', desc: 'Top picks & summary' },
            { icon: '🕯️', title: 'Pola Candle', desc: 'Pattern penting terdeteksi' },
            { icon: '⚠️', title: 'RSI Extreme', desc: 'Oversold / Overbought' },
            { icon: '📈', title: 'Breakout Alert', desc: 'Harga menembus resistance' },
            { icon: '🔔', title: 'Custom Alert', desc: 'Notif manual per saham' },
          ].map(item => (
            <div key={item.title} style={{ background: 'rgba(163,255,0,0.03)', border: '1px solid rgba(163,255,0,0.08)', borderRadius: '8px', padding: '12px' }}>
              <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>{item.icon}</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#e8f4f8', marginBottom: '3px' }}>{item.title}</p>
              <p style={{ fontSize: '11px', color: '#7a9bb5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
