# 📈 StockPro Screener

Platform screening saham profesional untuk pasar IDX (Indonesia) dan US Markets dengan analisis teknikal lengkap, deteksi pola candle, scoring AI, dan integrasi Telegram Bot.

## ✨ Fitur Lengkap

### 📊 Screener & Analisis
- **Real-time Screening** — 20+ saham IDX & US dianalisis secara bersamaan
- **AI Scoring (0-100)** — Skor gabungan dari 10+ indikator teknikal
- **Signal Detection** — STRONG BUY / BUY / NEUTRAL / SELL / STRONG SELL
- **Filter Canggih** — Filter berdasarkan signal, sektor, skor, RSI, volume
- **Sort Multi-kolom** — Urutkan berdasarkan score, perubahan, volume, RSI
- **Live Ticker Tape** — Scrolling harga real-time di bagian atas

### 🕯️ Candlestick Pattern Recognition
- **15+ Pola Candle** — Hammer, Doji, Engulfing, Morning Star, Evening Star, Marubozu, Harami, Shooting Star, Piercing Line, Dark Cloud Cover, dll
- **Reliability Rating** — High/Medium/Low confidence per pattern
- **Tipe Pattern** — Bullish / Bearish / Neutral classification

### 📐 Indikator Teknikal (14 Indikator)
| Indikator | Keterangan |
|-----------|-----------|
| RSI (14) | Relative Strength Index dengan gauge visual |
| MACD (12,26,9) | Line, Signal, Histogram |
| EMA 20/50/200 | Exponential Moving Average |
| SMA 20/50 | Simple Moving Average |
| Bollinger Bands (20,2) | Upper, Middle, Lower |
| Stochastic (14,3) | %K dan %D |
| ATR (14) | Average True Range |
| OBV | On-Balance Volume |
| VWAP | Volume-Weighted Average Price |
| ADX (14) | Average Directional Index |
| Williams %R | Momentum oscillator |
| CCI (20) | Commodity Channel Index |
| MFI (14) | Money Flow Index |

### 📉 Grafik Interaktif
- **Candlestick Chart** — Powered by TradingView Lightweight Charts
- **EMA Lines** — EMA 20 (hijau), 50 (kuning), 200 (oranye) overlay
- **Bollinger Bands** — Toggle on/off
- **Volume Histogram** — Warna-coded berdasarkan arah harga
- **Zoom & Pan** — Interaksi penuh pada grafik

### ⭐ Watchlist
- Tambah/hapus saham dari watchlist
- Card view dengan RSI gauge, signal, dan candle pattern
- Klik untuk detail langsung

### 🔔 Price Alerts
- Set alert berdasarkan harga (di atas / di bawah target)
- Deteksi triggered alert secara real-time
- Tambah alert untuk simbol apapun

### 📱 Integrasi Telegram Bot
- **Test Connection** — Cek koneksi bot langsung dari UI
- **Kirim Signal** — Kirim detail sinyal saham individual ke Telegram
- **Laporan Harian** — Ringkasan top picks, strong buy, sell dalam format terformat
- **Custom Alert** — Notifikasi otomatis ketika sinyal kuat terdeteksi
- Format pesan profesional dengan MarkdownV2

### 🌐 Multi-Market
- **IDX (BEI)** — 20 saham blue chip Indonesia
- **US Markets** — 10 saham top NYSE/NASDAQ
- Toggle cepat antar pasar

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd stock-screener
npm install
```

### 2. Setup Environment Variables

Salin `.env.local` dan isi nilainya:

```bash
cp .env.local .env.local
```

Edit `.env.local`:
```env
# Alpha Vantage (opsional, untuk data real - gratis di alphavantage.co)
ALPHA_VANTAGE_KEY=your_key_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. Jalankan Lokal

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📡 Cara Setup Telegram Bot

1. **Buka Telegram** → Cari `@BotFather`
2. Ketik `/newbot` → ikuti instruksi
3. **Salin Bot Token** yang diberikan (format: `1234567890:ABCdef...`)
4. **Start chat** dengan bot Anda
5. Cari `@userinfobot` → kirim pesan → salin Chat ID Anda
6. Masukkan ke **Settings → Telegram** di aplikasi atau di `.env.local`
7. Klik **Test Koneksi** untuk verifikasi

### Jenis Notifikasi Telegram

```
🚀 STRONG BUY Signal
📊 Laporan Harian (top picks + summary)
🕯️ Pola Candle penting terdeteksi
⚠️ RSI Extreme (Oversold/Overbought)
📈 Breakout Alert
🔔 Custom Alert per saham
```

---

## 🌍 Deploy ke Vercel

### Opsi 1: Vercel CLI (Rekomendasi)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Atau langsung production
vercel --prod
```

### Opsi 2: GitHub + Vercel Dashboard

1. Push kode ke GitHub repository
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repository dari GitHub
4. Framework: **Next.js** (auto-detect)
5. Tambahkan **Environment Variables**:
   - `ALPHA_VANTAGE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
6. Klik **Deploy**

### Environment Variables di Vercel

Di Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `ALPHA_VANTAGE_KEY` | `your_key` | Production, Preview |
| `TELEGRAM_BOT_TOKEN` | `your_token` | Production, Preview |
| `TELEGRAM_CHAT_ID` | `your_chat_id` | Production, Preview |

---

## 🔌 Integrasi Data Real

Aplikasi ini secara default menggunakan **data simulasi** yang realistis. Untuk data live:

### Alpha Vantage (Gratis, 25 req/hari)
1. Daftar di [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Dapatkan API key gratis
3. Set `ALPHA_VANTAGE_KEY=your_key` di environment
4. Data IDX: `BBCA.JK`, `TLKM.JK`, dll (suffix `.JK`)

### Finnhub (Alternatif)
1. Daftar di [finnhub.io](https://finnhub.io/)
2. Set `FINNHUB_KEY=your_key`

---

## 🏗️ Struktur Project

```
stock-screener/
├── src/
│   ├── pages/
│   │   ├── index.tsx          # Halaman utama (dashboard)
│   │   ├── _app.tsx           # App wrapper
│   │   ├── _document.tsx      # HTML document
│   │   └── api/
│   │       ├── telegram.ts    # Telegram Bot API endpoint
│   │       ├── screener.ts    # Screener API endpoint
│   │       └── stock/
│   │           └── [symbol].ts # Detail saham per simbol
│   ├── components/
│   │   ├── CandleChart.tsx    # TradingView chart
│   │   ├── Indicators.tsx     # Komponen: SignalBadge, ScoreRing, dll
│   │   ├── StockDetail.tsx    # Modal detail saham
│   │   └── TelegramSetup.tsx  # Halaman konfigurasi Telegram
│   ├── lib/
│   │   ├── stockUtils.ts      # Kalkulasi teknikal + data generator
│   │   └── store.ts           # Zustand global state
│   └── styles/
│       └── globals.css        # Global styles + tema
├── public/
├── vercel.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|-----------|---------|
| **Next.js 14** | React framework + API routes |
| **TypeScript** | Type safety |
| **TailwindCSS** | Utility CSS |
| **Lightweight Charts** | Grafik candlestick (TradingView) |
| **Zustand** | Global state management |
| **Lucide React** | Icons |
| **Alpha Vantage API** | Data harga saham (opsional) |
| **Telegram Bot API** | Notifikasi |

---

## 📊 Cara Kerja Scoring Engine

Score 0-100 dihitung berdasarkan:

| Indikator | Bobot |
|-----------|-------|
| MACD crossover | 20% |
| EMA position (price vs EMA) | 20% |
| RSI level | 15% |
| Candle pattern (adjusted by reliability) | 15% |
| Stochastic K/D | 10% |
| Bollinger position | 10% |
| Momentum indicators | 10% |

**Signal mapping:**
- Score ≥ 75 → 🚀 STRONG BUY
- Score 60-74 → 🟢 BUY
- Score 40-59 → ⚪ NEUTRAL
- Score 25-39 → 🟠 SELL
- Score < 25 → 🔴 STRONG SELL

---

## ⚠️ Disclaimer

Aplikasi ini dibuat untuk tujuan **edukasi dan analisis teknikal** saja. **Bukan merupakan rekomendasi investasi**. Selalu lakukan riset mandiri dan konsultasikan dengan penasihat keuangan sebelum mengambil keputusan investasi.

---

## 📝 License

MIT License — bebas digunakan dan dimodifikasi.
