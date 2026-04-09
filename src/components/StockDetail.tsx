// components/StockDetail.tsx
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Bell, Star, Send, TrendingUp, TrendingDown, Activity, BarChart2, Layers, Target } from 'lucide-react';
import { SignalBadge, ScoreRing, CandlePatternBadge, RSIGauge, ChangeDisplay } from './Indicators';
import { useStore } from '../lib/store';
import { calcEMA, calcBollinger, formatNumber } from '../lib/stockUtils';

const CandleChart = dynamic(() => import('./CandleChart'), { ssr: false });

interface StockDetailProps {
  symbol: string;
  onClose: () => void;
}

export default function StockDetail({ symbol, onClose }: StockDetailProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'technicals' | 'chart' | 'patterns'>('overview');
  const [showBB, setShowBB] = useState(false);
  const [showEMA, setShowEMA] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const { addToWatchlist, removeFromWatchlist, watchlist, telegramConfig } = useStore();
  const isWatchlisted = watchlist.includes(symbol);

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stock/${symbol}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [symbol]);

  const sendToTelegram = async () => {
    if (!data) return;
    setSending(true);
    setSendStatus(null);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'signal',
          chatId: telegramConfig.chatId || undefined,
          stocks: [{
            symbol: data.symbol,
            name: data.name,
            price: data.price,
            changePercent: data.changePercent,
            signal: data.signal || 'NEUTRAL',
            score: data.score || 50,
            rsi: data.indicators?.rsi,
            candlePattern: data.candlePattern?.name || null,
          }],
        }),
      });
      const json = await res.json();
      setSendStatus(json.success ? 'Terkirim ke Telegram! ✓' : `Error: ${json.error}`);
    } catch (e) {
      setSendStatus('Gagal mengirim');
    } finally {
      setSending(false);
      setTimeout(() => setSendStatus(null), 4000);
    }
  };

  const emaData = data?.candles ? {
    ema20: calcEMA(data.candles.map((c: any) => c.close), 20),
    ema50: calcEMA(data.candles.map((c: any) => c.close), 50),
    ema200: calcEMA(data.candles.map((c: any) => c.close), 200),
    bollinger: calcBollinger(data.candles.map((c: any) => c.close)),
  } : null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'chart', label: 'Chart', icon: BarChart2 },
    { id: 'technicals', label: 'Technicals', icon: Activity },
    { id: 'patterns', label: 'Patterns', icon: Layers },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 4, 8, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#091524',
        border: '1px solid rgba(163,255,0,0.15)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 60px rgba(0,0,0,0.8)',
        animation: 'fadeUp 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(163,255,0,0.08)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
            <div style={{ background: 'rgba(163,255,0,0.08)', border: '1px solid rgba(163,255,0,0.2)', borderRadius: '10px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#a3ff00', flexShrink: 0 }}>
              {loading ? '...' : symbol.slice(0, 2)}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: 700, color: '#e8f4f8', margin: 0 }}>{symbol}</h2>
              <p style={{ color: '#7a9bb5', fontSize: '13px', margin: '2px 0 6px' }}>{loading ? 'Loading...' : data?.name} • {loading ? '' : data?.sector}</p>
              {!loading && data && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '20px', fontWeight: 700, color: '#e8f4f8' }}>
                    {data.price?.toLocaleString('id-ID')}
                  </span>
                  <ChangeDisplay value={data.changePercent} />
                  <SignalBadge signal={data.signal || 'NEUTRAL'} />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {sendStatus && (
              <span style={{ fontSize: '12px', color: sendStatus.startsWith('Error') ? '#ff3366' : '#00ff88', fontFamily: 'Space Mono, monospace' }}>
                {sendStatus}
              </span>
            )}
            <button onClick={sendToTelegram} disabled={sending || loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <Send size={13} />
              {sending ? 'Mengirim...' : 'Telegram'}
            </button>
            <button onClick={() => isWatchlisted ? removeFromWatchlist(symbol) : addToWatchlist(symbol)} style={{ background: isWatchlisted ? 'rgba(255,215,0,0.1)' : 'transparent', border: `1px solid ${isWatchlisted ? 'rgba(255,215,0,0.4)' : 'rgba(163,255,0,0.2)'}`, color: isWatchlisted ? '#ffd700' : '#7a9bb5', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Star size={14} fill={isWatchlisted ? '#ffd700' : 'none'} />
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(163,255,0,0.15)', color: '#7a9bb5', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 24px', borderBottom: '1px solid rgba(163,255,0,0.08)', display: 'flex', gap: '4px', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
              background: activeTab === tab.id ? 'rgba(163,255,0,0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #a3ff00' : '2px solid transparent',
              color: activeTab === tab.id ? '#a3ff00' : '#7a9bb5',
              fontFamily: 'Space Mono, monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              padding: '12px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}>
              <tab.icon size={12} />
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '12px' }}>
              <div className="spinner" />
              <span style={{ color: '#7a9bb5', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>Memuat data...</span>
            </div>
          ) : data && (
            <>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {/* Price Stats */}
                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>Statistik Harga</h3>
                    {[
                      { label: 'Open', value: data.open?.toLocaleString('id-ID') },
                      { label: 'High', value: data.high?.toLocaleString('id-ID'), color: '#00ff88' },
                      { label: 'Low', value: data.low?.toLocaleString('id-ID'), color: '#ff3366' },
                      { label: 'Close', value: data.close?.toLocaleString('id-ID') },
                      { label: 'VWAP', value: data.indicators?.vwap?.toLocaleString('id-ID') },
                      { label: '52W High', value: data.high52w?.toLocaleString('id-ID'), color: '#00ff88' },
                      { label: '52W Low', value: data.low52w?.toLocaleString('id-ID'), color: '#ff3366' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(163,255,0,0.04)' }}>
                        <span style={{ fontSize: '12px', color: '#7a9bb5' }}>{item.label}</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: item.color || '#e8f4f8' }}>{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fundamentals */}
                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>Fundamental</h3>
                    {[
                      { label: 'Market Cap', value: formatNumber(data.marketCap || 0) },
                      { label: 'P/E Ratio', value: data.pe?.toFixed(1) },
                      { label: 'EPS', value: data.eps?.toFixed(2) },
                      { label: 'Beta', value: data.beta?.toFixed(2) },
                      { label: 'Volume', value: formatNumber(data.volume || 0, 0) },
                      { label: 'ATR (14)', value: data.indicators?.atr?.toFixed(2) },
                      { label: 'ADX (14)', value: data.indicators?.adx?.toFixed(2) },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(163,255,0,0.04)' }}>
                        <span style={{ fontSize: '12px', color: '#7a9bb5' }}>{item.label}</span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#e8f4f8' }}>{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Score + Candle Pattern */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>AI Score</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <ScoreRing score={data.score || 50} size={72} />
                        <div>
                          <SignalBadge signal={data.signal || 'NEUTRAL'} size="lg" />
                          <p style={{ fontSize: '11px', color: '#7a9bb5', marginTop: '8px' }}>Berdasarkan {Object.keys(data.indicators || {}).length} indikator teknikal</p>
                        </div>
                      </div>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                      <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>Pola Candle Terakhir</h3>
                      <CandlePatternBadge pattern={data.candlePattern} />
                      {data.candlePattern && (
                        <p style={{ fontSize: '12px', color: '#7a9bb5', marginTop: '10px' }}>{data.candlePattern.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Support/Resistance */}
                  <div className="card" style={{ padding: '16px', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>Support & Resistance</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#7a9bb5', marginBottom: '8px' }}>Support Levels</p>
                        {(data.supportLevels || []).map((level: number, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ width: '8px', height: '1px', background: `rgba(0,255,136,${1 - i * 0.3})` }} />
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#00ff88', opacity: 1 - i * 0.25 }}>
                              S{i + 1}: {level.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#7a9bb5', marginBottom: '8px' }}>Resistance Levels</p>
                        {(data.resistanceLevels || []).map((level: number, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ width: '8px', height: '1px', background: `rgba(255,51,102,${1 - i * 0.3})` }} />
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#ff3366', opacity: 1 - i * 0.25 }}>
                              R{i + 1}: {level.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'chart' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowEMA(!showEMA)} className={showEMA ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '10px', padding: '6px 12px' }}>EMA Lines</button>
                    <button onClick={() => setShowBB(!showBB)} className={showBB ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '10px', padding: '6px 12px' }}>Bollinger Bands</button>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {[{ color: '#a3ff00', label: 'EMA20' }, { color: '#ffd700', label: 'EMA50' }, { color: '#ff6b35', label: 'EMA200' }].map(item => (
                        <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#7a9bb5' }}>
                          <span style={{ width: '20px', height: '2px', background: item.color, display: 'inline-block', borderRadius: '1px' }} />
                          {item.label}
                        </span>
                      ))}
                    </span>
                  </div>
                  <CandleChart
                    candles={data.candles}
                    ema20={showEMA ? emaData?.ema20 : undefined}
                    ema50={showEMA ? emaData?.ema50 : undefined}
                    ema200={showEMA ? emaData?.ema200 : undefined}
                    showBollinger={showBB}
                    bollingerData={showBB ? emaData?.bollinger : undefined}
                    height={420}
                    showVolume={true}
                  />
                </div>
              )}

              {activeTab === 'technicals' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>Momentum</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#7a9bb5' }}>RSI (14)</span>
                        </div>
                        <RSIGauge value={data.indicators?.rsi} />
                      </div>
                      <div style={{ padding: '8px 0', borderTop: '1px solid rgba(163,255,0,0.06)' }}>
                        <span style={{ fontSize: '12px', color: '#7a9bb5', display: 'block', marginBottom: '6px' }}>Stochastic K/D</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: data.indicators?.stochastic?.k < 20 ? '#00ff88' : data.indicators?.stochastic?.k > 80 ? '#ff3366' : '#e8f4f8' }}>
                            %K: {data.indicators?.stochastic?.k?.toFixed(1) || '—'}
                          </span>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#7a9bb5' }}>
                            %D: {data.indicators?.stochastic?.d?.toFixed(1) || '—'}
                          </span>
                        </div>
                      </div>
                      {[
                        { label: "Williams %R", value: data.indicators?.williamsR?.toFixed(2), low: -80, high: -20 },
                        { label: "CCI (20)", value: data.indicators?.cci?.toFixed(2) },
                        { label: "MFI (14)", value: data.indicators?.mfi?.toFixed(2) },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(163,255,0,0.06)' }}>
                          <span style={{ fontSize: '12px', color: '#7a9bb5' }}>{item.label}</span>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#e8f4f8' }}>{item.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>Trend (EMA / SMA)</h3>
                    {[
                      { label: 'EMA 20', value: data.indicators?.ema20, compare: data.price },
                      { label: 'EMA 50', value: data.indicators?.ema50, compare: data.price },
                      { label: 'EMA 200', value: data.indicators?.ema200, compare: data.price },
                      { label: 'SMA 20', value: data.indicators?.sma20, compare: data.price },
                      { label: 'SMA 50', value: data.indicators?.sma50, compare: data.price },
                    ].map(item => {
                      const isAbove = item.compare > item.value;
                      return (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(163,255,0,0.04)' }}>
                          <span style={{ fontSize: '12px', color: '#7a9bb5' }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#e8f4f8' }}>{item.value?.toLocaleString('id-ID') || '—'}</span>
                            <span style={{ fontSize: '10px', fontFamily: 'Space Mono, monospace', padding: '1px 6px', borderRadius: '3px', background: isAbove ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', color: isAbove ? '#00ff88' : '#ff3366' }}>
                              {isAbove ? '▲ ABOVE' : '▼ BELOW'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="card" style={{ padding: '16px' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '14px', textTransform: 'uppercase' }}>MACD & Volume</h3>
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#7a9bb5', display: 'block', marginBottom: '6px' }}>MACD (12,26,9)</span>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: '#3d5a73' }}>Line</span>
                            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: data.indicators?.macd?.value > 0 ? '#00ff88' : '#ff3366' }}>
                              {data.indicators?.macd?.value?.toFixed(4) || '—'}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: '#3d5a73' }}>Signal</span>
                            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#e8f4f8' }}>
                              {data.indicators?.macd?.signal?.toFixed(4) || '—'}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: '#3d5a73' }}>Histogram</span>
                            <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: data.indicators?.macd?.histogram > 0 ? '#00ff88' : '#ff3366' }}>
                              {data.indicators?.macd?.histogram?.toFixed(4) || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '10px 0', borderTop: '1px solid rgba(163,255,0,0.06)' }}>
                        <span style={{ fontSize: '12px', color: '#7a9bb5' }}>Bollinger Bands</span>
                        {data.indicators?.bollinger && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
                            {[['Upper', data.indicators.bollinger.upper, '#ff3366'], ['Middle', data.indicators.bollinger.middle, '#ffd700'], ['Lower', data.indicators.bollinger.lower, '#00ff88']].map(([label, val, color]) => (
                              <div key={label as string}>
                                <span style={{ fontSize: '10px', color: '#3d5a73' }}>{label}</span>
                                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: color as string }}>{(val as number)?.toLocaleString('id-ID')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {[
                        { label: 'OBV', value: formatNumber(data.indicators?.obv || 0) },
                        { label: 'ATR (14)', value: data.indicators?.atr?.toFixed(2) },
                        { label: 'ADX (14)', value: data.indicators?.adx?.toFixed(2) },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid rgba(163,255,0,0.04)' }}>
                          <span style={{ fontSize: '12px', color: '#7a9bb5' }}>{item.label}</span>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#e8f4f8' }}>{item.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'patterns' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>Pola Candlestick Terakhir</h3>
                    {data.candlePattern ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                        <div>
                          <CandlePatternBadge pattern={data.candlePattern} />
                          <p style={{ fontSize: '13px', color: '#7a9bb5', marginTop: '10px', maxWidth: '400px', lineHeight: 1.6 }}>{data.candlePattern.description}</p>
                        </div>
                        <div style={{ background: 'rgba(163,255,0,0.04)', border: '1px solid rgba(163,255,0,0.1)', borderRadius: '8px', padding: '12px 16px' }}>
                          <p style={{ fontSize: '11px', color: '#3d5a73', marginBottom: '8px', fontFamily: 'Space Mono, monospace', letterSpacing: '0.05em' }}>RELIABILITAS</p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['high', 'medium', 'low'].map(level => (
                              <div key={level} style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: data.candlePattern?.reliability === level
                                  ? level === 'high' ? '#00ff88' : level === 'medium' ? '#ffd700' : '#ff8c00'
                                  : 'rgba(163,255,0,0.06)',
                                border: `1px solid ${data.candlePattern?.reliability === level ? 'transparent' : 'rgba(163,255,0,0.1)'}`,
                              }} />
                            ))}
                          </div>
                          <p style={{ fontSize: '11px', color: '#7a9bb5', marginTop: '6px', textTransform: 'capitalize' }}>{data.candlePattern?.reliability} reliability</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#7a9bb5', fontSize: '13px' }}>Tidak ada pola signifikan yang terdeteksi pada candle terakhir.</p>
                    )}
                  </div>

                  {/* Pattern Guide */}
                  <div className="card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                    <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' }}>Panduan Pola Candle</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                      {[
                        { name: 'Hammer', type: 'bullish', desc: 'Reversal bullish setelah downtrend' },
                        { name: 'Shooting Star', type: 'bearish', desc: 'Reversal bearish di resistance' },
                        { name: 'Doji', type: 'neutral', desc: 'Indecision, kemungkinan reversal' },
                        { name: 'Bullish Engulfing', type: 'bullish', desc: 'Sinyal pembalikan bullish kuat' },
                        { name: 'Bearish Engulfing', type: 'bearish', desc: 'Sinyal pembalikan bearish kuat' },
                        { name: 'Morning Star', type: 'bullish', desc: 'Pola 3 candle, reversal kuat' },
                        { name: 'Evening Star', type: 'bearish', desc: 'Pola 3 candle, reversal bearish' },
                        { name: 'Marubozu', type: 'bullish', desc: 'Momentum kuat tanpa wick' },
                      ].map(p => (
                        <div key={p.name} style={{ background: 'rgba(163,255,0,0.03)', border: '1px solid rgba(163,255,0,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', fontWeight: 700, color: p.type === 'bullish' ? '#00ff88' : p.type === 'bearish' ? '#ff3366' : '#ffd700' }}>{p.name}</span>
                          <p style={{ fontSize: '11px', color: '#7a9bb5', marginTop: '4px', lineHeight: 1.5 }}>{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
