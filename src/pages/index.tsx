// pages/index.tsx
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  Search, Filter, RefreshCw, TrendingUp, TrendingDown,
  Star, Bell, Settings, BarChart2, Activity, Layers,
  Send, ChevronDown, ChevronUp, ArrowUpDown, Zap,
  Globe, Clock, AlertTriangle, CheckCircle2, X, Menu
} from 'lucide-react';
import { useStore } from '../lib/store';
import { generateScreenerData, IDX_STOCKS, US_STOCKS, ScreenerResult, formatNumber } from '../lib/stockUtils';
import { SignalBadge, ScoreRing, CandlePatternBadge, ChangeDisplay, RSIGauge } from '../components/Indicators';
import TelegramSetup from '../components/TelegramSetup';

const StockDetail = dynamic(() => import('../components/StockDetail'), { ssr: false });

type SortKey = 'score' | 'changePercent' | 'volume' | 'price' | 'rsi';
type TabId = 'screener' | 'watchlist' | 'telegram' | 'alerts';

export default function Home() {
  const {
    market, setMarket,
    screenerResults, setScreenerResults,
    isLoading, setIsLoading,
    watchlist, addToWatchlist, removeFromWatchlist,
    telegramConfig,
    alerts, addAlert, removeAlert,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabId>('screener');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterSignal, setFilterSignal] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [minScore, setMinScore] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tickerData, setTickerData] = useState<ScreenerResult[]>([]);
  const [newAlertSymbol, setNewAlertSymbol] = useState('');
  const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above');
  const [newAlertValue, setNewAlertValue] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const stocks = market === 'US' ? US_STOCKS : IDX_STOCKS;
      const results = generateScreenerData(stocks);
      setScreenerResults(results);
      setTickerData(results);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 800);
  }, [market, setIsLoading, setScreenerResults]);

  useEffect(() => {
    loadData();
  }, [market, loadData]);

  // Filter & sort
  const filtered = screenerResults
    .filter(s => {
      if (search && !s.symbol.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSignal && s.signal !== filterSignal) return false;
      if (filterSector && s.sector !== filterSector) return false;
      if (minScore && s.score < Number(minScore)) return false;
      return true;
    })
    .sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === 'score') { av = a.score; bv = b.score; }
      else if (sortKey === 'changePercent') { av = a.changePercent; bv = b.changePercent; }
      else if (sortKey === 'volume') { av = a.volume; bv = b.volume; }
      else if (sortKey === 'price') { av = a.price; bv = b.price; }
      else if (sortKey === 'rsi') { av = a.indicators.rsi || 0; bv = b.indicators.rsi || 0; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const watchlistStocks = screenerResults.filter(s => watchlist.includes(s.symbol));
  const sectors = [...new Set(screenerResults.map(s => s.sector).filter(Boolean))];
  const signalCounts = {
    STRONG_BUY: screenerResults.filter(s => s.signal === 'STRONG_BUY').length,
    BUY: screenerResults.filter(s => s.signal === 'BUY').length,
    NEUTRAL: screenerResults.filter(s => s.signal === 'NEUTRAL').length,
    SELL: screenerResults.filter(s => s.signal === 'SELL').length,
    STRONG_SELL: screenerResults.filter(s => s.signal === 'STRONG_SELL').length,
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sendReport = async () => {
    setSendingReport(true);
    setReportStatus(null);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'report',
          chatId: telegramConfig.chatId || undefined,
          stocks: screenerResults.slice(0, 15).map(s => ({
            symbol: s.symbol, name: s.name, price: s.price,
            changePercent: s.changePercent, signal: s.signal,
            score: s.score, rsi: s.indicators.rsi,
            candlePattern: s.candlePattern?.name || null,
          })),
        }),
      });
      const data = await res.json();
      setReportStatus(data.success ? '✓ Laporan terkirim!' : `✗ ${data.error}`);
    } catch { setReportStatus('✗ Error'); }
    finally { setSendingReport(false); setTimeout(() => setReportStatus(null), 5000); }
  };

  const addNewAlert = () => {
    if (!newAlertSymbol || !newAlertValue) return;
    addAlert({
      id: Date.now().toString(),
      symbol: newAlertSymbol.toUpperCase(),
      type: newAlertType,
      value: Number(newAlertValue),
      message: `${newAlertSymbol.toUpperCase()} ${newAlertType === 'above' ? 'di atas' : 'di bawah'} ${Number(newAlertValue).toLocaleString('id-ID')}`,
      triggered: false,
      createdAt: new Date(),
    });
    setNewAlertSymbol('');
    setNewAlertValue('');
  };

  const navItems: { id: TabId; label: string; icon: any }[] = [
    { id: 'screener', label: 'Screener', icon: BarChart2 },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'telegram', label: 'Telegram', icon: Send },
  ];

  return (
    <>
      <Head>
        <title>StockPro Screener — IDX & US Markets</title>
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        {/* ── TICKER TAPE ── */}
        {tickerData.length > 0 && (
          <div style={{ background: 'rgba(9,21,36,0.95)', borderBottom: '1px solid rgba(163,255,0,0.08)', overflow: 'hidden', height: '32px', display: 'flex', alignItems: 'center' }}>
            <div style={{ background: '#a3ff00', color: '#020408', fontFamily: 'Space Mono, monospace', fontSize: '10px', fontWeight: 700, padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', letterSpacing: '0.06em', flexShrink: 0, zIndex: 2 }}>
              LIVE
            </div>
            <div className="ticker-wrap" style={{ flex: 1 }}>
              <div className="ticker-inner">
                {[...tickerData, ...tickerData].map((s, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 20px', fontFamily: 'Space Mono, monospace', fontSize: '11px', cursor: 'pointer' }} onClick={() => setSelectedSymbol(s.symbol)}>
                    <span style={{ color: '#e8f4f8', fontWeight: 700 }}>{s.symbol}</span>
                    <span style={{ color: s.changePercent >= 0 ? '#00ff88' : '#ff3366' }}>
                      {s.changePercent >= 0 ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(2)}%
                    </span>
                    <span style={{ color: '#3d5a73' }}>|</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <header style={{ background: 'rgba(5,12,20,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(163,255,0,0.1)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(163,255,0,0.15)', border: '1px solid rgba(163,255,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={16} color="#a3ff00" />
            </div>
            <div>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: 700, color: '#e8f4f8', letterSpacing: '0.02em' }}>StockPro</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#a3ff00', display: 'block', letterSpacing: '0.12em', lineHeight: 1, marginTop: '-1px' }}>SCREENER</span>
            </div>
          </div>

          {/* Market Toggle */}
          <div style={{ display: 'flex', background: 'rgba(163,255,0,0.06)', border: '1px solid rgba(163,255,0,0.15)', borderRadius: '8px', overflow: 'hidden' }}>
            {(['IDX', 'US'] as const).map(m => (
              <button key={m} onClick={() => setMarket(m)} style={{ padding: '6px 16px', border: 'none', background: market === m ? 'rgba(163,255,0,0.15)' : 'transparent', color: market === m ? '#a3ff00' : '#7a9bb5', fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={11} />
                {m === 'IDX' ? 'IDX' : 'NYSE'}
              </button>
            ))}
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3d5a73', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>
              <div className="signal-dot live" />
              <Clock size={10} />
              {lastUpdated.toLocaleTimeString('id-ID')}
            </div>
          )}

          {/* Send Report */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {reportStatus && <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: reportStatus.startsWith('✓') ? '#00ff88' : '#ff3366' }}>{reportStatus}</span>}
            <button onClick={sendReport} disabled={sendingReport || screenerResults.length === 0} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', padding: '6px 12px' }}>
              <Send size={12} />
              {sendingReport ? 'Mengirim...' : 'Laporan'}
            </button>
            <button onClick={loadData} disabled={isLoading} style={{ background: 'transparent', border: '1px solid rgba(163,255,0,0.15)', borderRadius: '6px', padding: '7px', color: '#7a9bb5', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>
              <RefreshCw size={13} style={{ animation: isLoading ? 'spin 0.6s linear infinite' : 'none' }} />
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>
          {/* ── SIDEBAR ── */}
          <aside style={{ width: '220px', background: 'rgba(5,12,20,0.8)', borderRight: '1px solid rgba(163,255,0,0.08)', padding: '20px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`} style={{ border: `1px solid ${activeTab === item.id ? 'rgba(163,255,0,0.2)' : 'transparent'}` }}>
                <item.icon size={15} />
                <span>{item.label}</span>
                {item.id === 'watchlist' && watchlist.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(163,255,0,0.15)', color: '#a3ff00', borderRadius: '10px', fontSize: '10px', padding: '1px 7px', fontFamily: 'Space Mono, monospace' }}>{watchlist.length}</span>
                )}
                {item.id === 'alerts' && alerts.length > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(255,215,0,0.15)', color: '#ffd700', borderRadius: '10px', fontSize: '10px', padding: '1px 7px', fontFamily: 'Space Mono, monospace' }}>{alerts.length}</span>
                )}
                {item.id === 'telegram' && telegramConfig.enabled && (
                  <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', flexShrink: 0 }} />
                )}
              </button>
            ))}

            {/* Signal Summary */}
            {screenerResults.length > 0 && (
              <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(163,255,0,0.03)', border: '1px solid rgba(163,255,0,0.08)', borderRadius: '10px' }}>
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '10px', textTransform: 'uppercase' }}>Market Summary</p>
                {[
                  { signal: 'STRONG_BUY', count: signalCounts.STRONG_BUY, color: '#00ff88', label: '🚀 Strong Buy' },
                  { signal: 'BUY', count: signalCounts.BUY, color: '#a3ff00', label: '🟢 Buy' },
                  { signal: 'NEUTRAL', count: signalCounts.NEUTRAL, color: '#ffd700', label: '⚪ Neutral' },
                  { signal: 'SELL', count: signalCounts.SELL, color: '#ff8c00', label: '🟠 Sell' },
                  { signal: 'STRONG_SELL', count: signalCounts.STRONG_SELL, color: '#ff3366', label: '🔴 Strong Sell' },
                ].map(item => (
                  <div key={item.signal} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }} onClick={() => { setActiveTab('screener'); setFilterSignal(filterSignal === item.signal ? '' : item.signal); }}>
                    <span style={{ fontSize: '11px', color: filterSignal === item.signal ? item.color : '#7a9bb5' }}>{item.label}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', fontWeight: 700, color: item.color }}>{item.count}</span>
                  </div>
                ))}
                <div style={{ marginTop: '8px', height: '4px', background: 'rgba(163,255,0,0.06)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                  {[
                    { pct: (signalCounts.STRONG_BUY / screenerResults.length) * 100, color: '#00ff88' },
                    { pct: (signalCounts.BUY / screenerResults.length) * 100, color: '#a3ff00' },
                    { pct: (signalCounts.NEUTRAL / screenerResults.length) * 100, color: '#ffd700' },
                    { pct: (signalCounts.SELL / screenerResults.length) * 100, color: '#ff8c00' },
                    { pct: (signalCounts.STRONG_SELL / screenerResults.length) * 100, color: '#ff3366' },
                  ].map((item, i) => (
                    <div key={i} style={{ height: '100%', width: `${item.pct}%`, background: item.color }} />
                  ))}
                </div>
              </div>
            )}

            {/* Top Movers */}
            {screenerResults.length > 0 && (
              <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(163,255,0,0.03)', border: '1px solid rgba(163,255,0,0.08)', borderRadius: '10px' }}>
                <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '10px', textTransform: 'uppercase' }}>Top Movers</p>
                {[...screenerResults].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3).map(s => (
                  <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', cursor: 'pointer' }} onClick={() => setSelectedSymbol(s.symbol)}>
                    <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#e8f4f8', fontWeight: 700 }}>{s.symbol}</span>
                    <ChangeDisplay value={s.changePercent} />
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(163,255,0,0.06)', marginTop: '8px', paddingTop: '8px' }}>
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: '#3d5a73', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>Bottom</p>
                  {[...screenerResults].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3).map(s => (
                    <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', cursor: 'pointer' }} onClick={() => setSelectedSymbol(s.symbol)}>
                      <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace', color: '#e8f4f8', fontWeight: 700 }}>{s.symbol}</span>
                      <ChangeDisplay value={s.changePercent} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {/* ── SCREENER TAB ── */}
            {activeTab === 'screener' && (
              <div>
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3d5a73' }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '36px' }}
                      placeholder={`Cari saham ${market === 'IDX' ? 'IDX' : 'US'}...`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <Filter size={13} />
                    Filter
                    {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#3d5a73' }}>
                    {filtered.length} / {screenerResults.length} saham
                  </span>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                  <div style={{ background: 'rgba(9,21,36,0.8)', border: '1px solid rgba(163,255,0,0.1)', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', animation: 'fadeUp 0.25s ease-out' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: '#3d5a73', fontFamily: 'Space Mono, monospace', letterSpacing: '0.08em', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Signal</label>
                      <select className="input-field" value={filterSignal} onChange={e => setFilterSignal(e.target.value)} style={{ fontSize: '12px' }}>
                        <option value="">Semua Signal</option>
                        <option value="STRONG_BUY">Strong Buy</option>
                        <option value="BUY">Buy</option>
                        <option value="NEUTRAL">Neutral</option>
                        <option value="SELL">Sell</option>
                        <option value="STRONG_SELL">Strong Sell</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#3d5a73', fontFamily: 'Space Mono, monospace', letterSpacing: '0.08em', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Sektor</label>
                      <select className="input-field" value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ fontSize: '12px' }}>
                        <option value="">Semua Sektor</option>
                        {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: '#3d5a73', fontFamily: 'Space Mono, monospace', letterSpacing: '0.08em', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Min Score</label>
                      <input className="input-field" type="number" placeholder="0 - 100" value={minScore} onChange={e => setMinScore(e.target.value)} style={{ fontSize: '12px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button onClick={() => { setFilterSignal(''); setFilterSector(''); setMinScore(''); setSearch(''); }} className="btn-secondary" style={{ width: '100%', fontSize: '11px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={12} /> Reset Filter
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Filter Chips */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: '🚀 Strong Buy', signal: 'STRONG_BUY' },
                    { label: '🟢 Buy', signal: 'BUY' },
                    { label: '🔴 Sell Zone', signal: 'SELL' },
                    { label: '⚡ Score 70+', minScore: '70' },
                  ].map(chip => (
                    <button key={chip.label} onClick={() => {
                      if (chip.signal) setFilterSignal(filterSignal === chip.signal ? '' : chip.signal);
                      if (chip.minScore) setMinScore(minScore === chip.minScore ? '' : chip.minScore);
                    }} style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(163,255,0,0.2)',
                      background: (chip.signal && filterSignal === chip.signal) || (chip.minScore && minScore === chip.minScore) ? 'rgba(163,255,0,0.12)' : 'transparent',
                      color: (chip.signal && filterSignal === chip.signal) || (chip.minScore && minScore === chip.minScore) ? '#a3ff00' : '#7a9bb5',
                      fontSize: '11px',
                      fontFamily: 'Space Mono, monospace',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="card" style={{ overflow: 'hidden' }}>
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '14px' }}>
                      <div className="spinner" />
                      <span style={{ color: '#7a9bb5', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>Menganalisis {screenerResults.length > 0 ? '' : market === 'IDX' ? 'IDX' : 'US'} stocks...</span>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ minWidth: '900px' }}>
                        <thead>
                          <tr>
                            <th>Saham</th>
                            <th>Sektor</th>
                            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('price')}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Harga <ArrowUpDown size={10} /></span>
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('changePercent')}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Perubahan <ArrowUpDown size={10} /></span>
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('volume')}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Volume <ArrowUpDown size={10} /></span>
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('rsi')}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>RSI <ArrowUpDown size={10} /></span>
                            </th>
                            <th>Pola Candle</th>
                            <th>Signal</th>
                            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('score')}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Score <ArrowUpDown size={10} /></span>
                            </th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((stock, idx) => (
                            <tr key={stock.symbol} style={{ animationDelay: `${idx * 0.03}s`, animation: 'fadeUp 0.3s ease-out both' }}>
                              <td>
                                <button onClick={() => setSelectedSymbol(stock.symbol)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#a3ff00', display: 'block' }}>{stock.symbol}</span>
                                  <span style={{ fontSize: '11px', color: '#7a9bb5' }}>{stock.name}</span>
                                </button>
                              </td>
                              <td><span style={{ fontSize: '11px', color: '#7a9bb5', background: 'rgba(163,255,0,0.05)', padding: '2px 7px', borderRadius: '4px' }}>{stock.sector}</span></td>
                              <td><span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#e8f4f8' }}>{stock.price.toLocaleString('id-ID')}</span></td>
                              <td><ChangeDisplay value={stock.changePercent} /></td>
                              <td><span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', color: '#7a9bb5' }}>{formatNumber(stock.volume, 0)}</span></td>
                              <td>
                                {stock.indicators.rsi !== null && (
                                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '12px', fontWeight: 700, color: stock.indicators.rsi < 30 ? '#00ff88' : stock.indicators.rsi > 70 ? '#ff3366' : '#e8f4f8' }}>
                                    {stock.indicators.rsi.toFixed(1)}
                                  </span>
                                )}
                              </td>
                              <td><CandlePatternBadge pattern={stock.candlePattern} /></td>
                              <td><SignalBadge signal={stock.signal} size="sm" /></td>
                              <td><ScoreRing score={stock.score} size={44} /></td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => setSelectedSymbol(stock.symbol)} style={{ background: 'rgba(163,255,0,0.08)', border: '1px solid rgba(163,255,0,0.2)', color: '#a3ff00', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>Detail</button>
                                  <button onClick={() => watchlist.includes(stock.symbol) ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock.symbol)} style={{ background: watchlist.includes(stock.symbol) ? 'rgba(255,215,0,0.1)' : 'transparent', border: `1px solid ${watchlist.includes(stock.symbol) ? 'rgba(255,215,0,0.3)' : 'rgba(163,255,0,0.1)'}`, color: watchlist.includes(stock.symbol) ? '#ffd700' : '#3d5a73', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' }}>
                                    {watchlist.includes(stock.symbol) ? '★' : '☆'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filtered.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#3d5a73', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>
                          Tidak ada saham yang cocok dengan filter Anda
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WATCHLIST TAB ── */}
            {activeTab === 'watchlist' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontFamily: 'Space Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#e8f4f8', marginBottom: '6px' }}>Watchlist</h2>
                  <p style={{ fontSize: '13px', color: '#7a9bb5' }}>{watchlist.length} saham dipantau</p>
                </div>

                {watchlistStocks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Star size={40} style={{ color: '#3d5a73', margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ color: '#3d5a73', fontFamily: 'Space Mono, monospace', fontSize: '13px', marginBottom: '8px' }}>Watchlist kosong</p>
                    <p style={{ fontSize: '12px', color: '#3d5a73' }}>Tambahkan saham dari tab Screener</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                    {watchlistStocks.map(stock => (
                      <div key={stock.symbol} className="card" style={{ padding: '18px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedSymbol(stock.symbol)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: 700, color: '#a3ff00', margin: 0 }}>{stock.symbol}</h3>
                            <p style={{ fontSize: '11px', color: '#7a9bb5', marginTop: '2px' }}>{stock.name}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <ScoreRing score={stock.score} size={44} />
                            <button onClick={e => { e.stopPropagation(); removeFromWatchlist(stock.symbol); }} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', padding: '4px' }}>
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '18px', fontWeight: 700, color: '#e8f4f8' }}>{stock.price.toLocaleString('id-ID')}</span>
                          <ChangeDisplay value={stock.changePercent} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <SignalBadge signal={stock.signal} size="sm" />
                          <CandlePatternBadge pattern={stock.candlePattern} />
                        </div>
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(163,255,0,0.06)' }}>
                          <RSIGauge value={stock.indicators.rsi} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ALERTS TAB ── */}
            {activeTab === 'alerts' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'Space Mono, monospace', fontSize: '16px', fontWeight: 700, color: '#e8f4f8', marginBottom: '6px' }}>Price Alerts</h2>
                  <p style={{ fontSize: '13px', color: '#7a9bb5' }}>Set notifikasi otomatis berdasarkan harga saham</p>
                </div>

                {/* Add Alert Form */}
                <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'Space Mono, monospace', fontSize: '11px', color: '#3d5a73', letterSpacing: '0.08em', marginBottom: '14px', textTransform: 'uppercase' }}>Tambah Alert Baru</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#7a9bb5', display: 'block', marginBottom: '6px', fontFamily: 'Space Mono, monospace' }}>Simbol</label>
                      <input className="input-field" placeholder="BBCA, TLKM..." value={newAlertSymbol} onChange={e => setNewAlertSymbol(e.target.value.toUpperCase())} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#7a9bb5', display: 'block', marginBottom: '6px', fontFamily: 'Space Mono, monospace' }}>Kondisi</label>
                      <select className="input-field" value={newAlertType} onChange={e => setNewAlertType(e.target.value as any)}>
                        <option value="above">Harga Di Atas</option>
                        <option value="below">Harga Di Bawah</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#7a9bb5', display: 'block', marginBottom: '6px', fontFamily: 'Space Mono, monospace' }}>Target Harga</label>
                      <input className="input-field" type="number" placeholder="10000" value={newAlertValue} onChange={e => setNewAlertValue(e.target.value)} />
                    </div>
                    <button onClick={addNewAlert} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <Bell size={13} /> Tambah Alert
                    </button>
                  </div>
                </div>

                {/* Alert List */}
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Bell size={40} style={{ color: '#3d5a73', margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ color: '#3d5a73', fontFamily: 'Space Mono, monospace', fontSize: '13px' }}>Belum ada alert yang dibuat</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {alerts.map(alert => {
                      const stock = screenerResults.find(s => s.symbol === alert.symbol);
                      const isTriggered = stock && (
                        (alert.type === 'above' && stock.price >= alert.value) ||
                        (alert.type === 'below' && stock.price <= alert.value)
                      );
                      return (
                        <div key={alert.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderColor: isTriggered ? 'rgba(255,215,0,0.3)' : undefined, background: isTriggered ? 'rgba(255,215,0,0.04)' : undefined }}>
                          {isTriggered ? <AlertTriangle size={18} color="#ffd700" /> : <Bell size={18} color="#3d5a73" />}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#a3ff00' }}>{alert.symbol}</span>
                              <span style={{ fontSize: '12px', color: '#7a9bb5' }}>{alert.type === 'above' ? '▲ Di atas' : '▼ Di bawah'}</span>
                              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#e8f4f8' }}>{alert.value.toLocaleString('id-ID')}</span>
                              {isTriggered && <span style={{ background: 'rgba(255,215,0,0.12)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)', fontSize: '10px', padding: '1px 7px', borderRadius: '4px', fontFamily: 'Space Mono, monospace' }}>TRIGGERED</span>}
                            </div>
                            {stock && <p style={{ fontSize: '11px', color: '#7a9bb5', marginTop: '4px' }}>Harga saat ini: <strong style={{ color: '#e8f4f8', fontFamily: 'Space Mono, monospace' }}>{stock.price.toLocaleString('id-ID')}</strong></p>}
                          </div>
                          <button onClick={() => removeAlert(alert.id)} style={{ background: 'none', border: 'none', color: '#3d5a73', cursor: 'pointer', padding: '4px' }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TELEGRAM TAB ── */}
            {activeTab === 'telegram' && <TelegramSetup />}
          </main>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(163,255,0,0.06)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'rgba(5,12,20,0.8)' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73' }}>
            StockPro Screener v1.0 — Data untuk tujuan edukasi
          </span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#3d5a73' }}>
            {screenerResults.length} saham dianalisis • {new Date().toLocaleDateString('id-ID')}
          </span>
        </footer>
      </div>

      {/* Stock Detail Modal */}
      {selectedSymbol && (
        <StockDetail symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
      )}
    </>
  );
}
