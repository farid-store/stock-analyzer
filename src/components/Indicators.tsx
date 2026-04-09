// components/SignalBadge.tsx
import React from 'react';

interface SignalBadgeProps {
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  size?: 'sm' | 'md' | 'lg';
}

const SIGNAL_CONFIG = {
  STRONG_BUY: { label: 'STRONG BUY', bg: 'rgba(0,255,136,0.12)', color: '#00ff88', border: 'rgba(0,255,136,0.3)', emoji: '🚀' },
  BUY: { label: 'BUY', bg: 'rgba(163,255,0,0.1)', color: '#a3ff00', border: 'rgba(163,255,0,0.3)', emoji: '🟢' },
  NEUTRAL: { label: 'NEUTRAL', bg: 'rgba(255,215,0,0.1)', color: '#ffd700', border: 'rgba(255,215,0,0.25)', emoji: '⚪' },
  SELL: { label: 'SELL', bg: 'rgba(255,51,102,0.1)', color: '#ff3366', border: 'rgba(255,51,102,0.25)', emoji: '🔴' },
  STRONG_SELL: { label: 'STRONG SELL', bg: 'rgba(255,51,102,0.15)', color: '#ff3366', border: 'rgba(255,51,102,0.4)', emoji: '💀' },
};

export function SignalBadge({ signal, size = 'md' }: SignalBadgeProps) {
  const cfg = SIGNAL_CONFIG[signal];
  const fontSize = size === 'sm' ? '10px' : size === 'lg' ? '13px' : '11px';
  const padding = size === 'sm' ? '2px 7px' : size === 'lg' ? '5px 14px' : '3px 10px';

  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize,
      fontFamily: 'Space Mono, monospace',
      fontWeight: 700,
      padding,
      borderRadius: '4px',
      letterSpacing: '0.05em',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// Score Ring Component
interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 60 }: ScoreRingProps) {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = () => {
    if (score >= 75) return '#00ff88';
    if (score >= 60) return '#a3ff00';
    if (score >= 40) return '#ffd700';
    if (score >= 25) return '#ff8c00';
    return '#ff3366';
  };

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(163,255,0,0.08)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="4"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${getColor()}80)` }}
        />
      </svg>
      <span style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: size < 50 ? '10px' : '13px',
        fontWeight: 700,
        color: getColor(),
        lineHeight: 1,
      }}>
        {score}
      </span>
    </div>
  );
}

// Candle Pattern Badge
interface CandlePatternBadgeProps {
  pattern: { name: string; type: 'bullish' | 'bearish' | 'neutral'; reliability: 'high' | 'medium' | 'low' } | null;
}

export function CandlePatternBadge({ pattern }: CandlePatternBadgeProps) {
  if (!pattern) return <span style={{ color: '#3d5a73', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>—</span>;

  const typeConfig = {
    bullish: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.25)', icon: '▲' },
    bearish: { color: '#ff3366', bg: 'rgba(255,51,102,0.1)', border: 'rgba(255,51,102,0.25)', icon: '▼' },
    neutral: { color: '#ffd700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.25)', icon: '◆' },
  };

  const reliabilityDots = {
    high: '●●●',
    medium: '●●○',
    low: '●○○',
  };

  const cfg = typeConfig[pattern.type];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {cfg.icon} {pattern.name}
      </span>
      <span style={{ color: cfg.color, fontSize: '9px', opacity: 0.7, fontFamily: 'monospace', letterSpacing: '1px' }}>
        {reliabilityDots[pattern.reliability]}
      </span>
    </div>
  );
}

// RSI Gauge
interface RSIGaugeProps {
  value: number | null;
}

export function RSIGauge({ value }: RSIGaugeProps) {
  if (value === null) return <span style={{ color: '#3d5a73' }}>N/A</span>;

  const getColor = () => {
    if (value < 30) return '#00ff88';
    if (value > 70) return '#ff3366';
    if (value > 60) return '#ffd700';
    return '#7a9bb5';
  };

  const getLabel = () => {
    if (value < 30) return 'Oversold';
    if (value > 70) return 'Overbought';
    if (value > 60) return 'Strong';
    if (value < 40) return 'Weak';
    return 'Neutral';
  };

  const color = getColor();
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '14px', fontWeight: 700, color, minWidth: '36px' }}>
        {value.toFixed(1)}
      </span>
      <div style={{ flex: 1, height: '4px', background: 'rgba(163,255,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, #00ff88, ${color})`,
          borderRadius: '2px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 6px ${color}60`,
        }} />
      </div>
      <span style={{ fontSize: '10px', color, fontFamily: 'Space Mono, monospace', minWidth: '60px' }}>{getLabel()}</span>
    </div>
  );
}

// Change display
interface ChangeDisplayProps {
  value: number;
  showArrow?: boolean;
  suffix?: string;
}

export function ChangeDisplay({ value, showArrow = true, suffix = '%' }: ChangeDisplayProps) {
  const isPositive = value >= 0;
  const color = isPositive ? '#00ff88' : '#ff3366';
  const arrow = isPositive ? '▲' : '▼';

  return (
    <span style={{ color, fontFamily: 'Space Mono, monospace', fontSize: '13px', fontWeight: 700 }}>
      {showArrow && `${arrow} `}{Math.abs(value).toFixed(2)}{suffix}
    </span>
  );
}
