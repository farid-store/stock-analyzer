// components/CandleChart.tsx
import { useEffect, useRef, useState } from 'react';
import { OHLCV } from '../lib/stockUtils';

interface CandleChartProps {
  candles: OHLCV[];
  ema20?: number[];
  ema50?: number[];
  ema200?: number[];
  height?: number;
  showVolume?: boolean;
  showEMA?: boolean;
  showBollinger?: boolean;
  bollingerData?: Array<{ upper: number; middle: number; lower: number }>;
}

export default function CandleChart({ candles, ema20, ema50, ema200, height = 400, showVolume = true, showEMA = true, showBollinger = false, bollingerData }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !candles.length) return;

    let chart: any;

    const initChart = async () => {
      const { createChart, CrosshairMode, LineStyle } = await import('lightweight-charts');

      if (chartRef.current) {
        chartRef.current.remove();
      }

      chart = createChart(containerRef.current!, {
        width: containerRef.current!.clientWidth,
        height: height,
        layout: {
          background: { color: 'transparent' },
          textColor: '#7a9bb5',
        },
        grid: {
          vertLines: { color: 'rgba(163, 255, 0, 0.04)', style: LineStyle.Dashed },
          horzLines: { color: 'rgba(163, 255, 0, 0.04)', style: LineStyle.Dashed },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: 'rgba(163, 255, 0, 0.4)', width: 1, style: LineStyle.Dashed },
          horzLine: { color: 'rgba(163, 255, 0, 0.4)', width: 1, style: LineStyle.Dashed },
        },
        rightPriceScale: {
          borderColor: 'rgba(163, 255, 0, 0.1)',
          textColor: '#7a9bb5',
        },
        timeScale: {
          borderColor: 'rgba(163, 255, 0, 0.1)',
          textColor: '#7a9bb5',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // Candlestick series
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ff88',
        downColor: '#ff3366',
        borderUpColor: '#00ff88',
        borderDownColor: '#ff3366',
        wickUpColor: '#00ff88',
        wickDownColor: '#ff3366',
      });

      candleSeries.setData(candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })));

      // EMA lines
      if (showEMA && ema20) {
        const ema20Series = chart.addLineSeries({
          color: '#a3ff00',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'EMA20',
        });
        ema20Series.setData(candles.map((c, i) => ({ time: c.time, value: ema20[i] })).filter(d => !isNaN(d.value)));
      }

      if (showEMA && ema50) {
        const ema50Series = chart.addLineSeries({
          color: '#ffd700',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'EMA50',
        });
        ema50Series.setData(candles.map((c, i) => ({ time: c.time, value: ema50[i] })).filter(d => !isNaN(d.value)));
      }

      if (showEMA && ema200) {
        const ema200Series = chart.addLineSeries({
          color: '#ff6b35',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'EMA200',
        });
        ema200Series.setData(candles.map((c, i) => ({ time: c.time, value: ema200[i] })).filter(d => !isNaN(d.value)));
      }

      // Bollinger Bands
      if (showBollinger && bollingerData) {
        const validBB = candles.map((c, i) => ({ time: c.time, bb: bollingerData[i] })).filter(d => d.bb && !isNaN(d.bb.upper));

        const bbUpper = chart.addLineSeries({ color: 'rgba(163, 255, 0, 0.4)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false, title: 'BB Upper' });
        const bbMiddle = chart.addLineSeries({ color: 'rgba(163, 255, 0, 0.6)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, title: 'BB Mid' });
        const bbLower = chart.addLineSeries({ color: 'rgba(163, 255, 0, 0.4)', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false, title: 'BB Lower' });

        bbUpper.setData(validBB.map(d => ({ time: d.time, value: d.bb.upper })));
        bbMiddle.setData(validBB.map(d => ({ time: d.time, value: d.bb.middle })));
        bbLower.setData(validBB.map(d => ({ time: d.time, value: d.bb.lower })));
      }

      // Volume
      if (showVolume) {
        const volumeSeries = chart.addHistogramSeries({
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          color: 'rgba(163, 255, 0, 0.15)',
        });
        chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        volumeSeries.setData(candles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)',
        })));
      }

      chart.timeScale().fitContent();

      // Resize handler
      const resizeObserver = new ResizeObserver(() => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      });
      if (containerRef.current) resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    };

    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [mounted, candles, ema20, ema50, ema200, showEMA, showBollinger, bollingerData, height, showVolume]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: `${height}px` }}
      className="rounded-lg overflow-hidden"
    />
  );
}
