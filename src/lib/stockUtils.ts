// lib/stockUtils.ts - Technical Analysis & Data Utilities

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52w?: number;
  low52w?: number;
  pe?: number;
  eps?: number;
  beta?: number;
}

export interface OHLCV {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  bollinger: { upper: number; middle: number; lower: number } | null;
  stochastic: { k: number; d: number } | null;
  atr: number | null;
  obv: number | null;
  vwap: number | null;
  adx: number | null;
  williamsR: number | null;
  cci: number | null;
  mfi: number | null;
}

export interface CandlePattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  description: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface ScreenerResult extends StockData {
  indicators: TechnicalIndicators;
  candlePattern: CandlePattern | null;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  score: number; // 0-100
  sector?: string;
  priceHistory?: OHLCV[];
}

// ── TECHNICAL CALCULATIONS ──────────────────────────────────────────────────

export function calcSMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const slice = prices.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

export function calcEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      result.push(prices[0]);
    } else {
      result.push(prices[i] * k + result[i - 1] * (1 - k));
    }
  }
  return result;
}

export function calcRSI(prices: number[], period = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    if (i === period - 1) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const prevRSI = result[result.length - 1];
      const prevAvgGain = ((prevRSI / (100 - prevRSI)) * losses[i - 1] * period - losses[i - 1] + gains[i]) / period;
      const avgGain = (gains[i] + (period - 1) * (result.length > 0 ? gains.slice(Math.max(0, i - period), i).reduce((a, b) => a + b, 0) / period : 0)) / period;
      const avgLoss = (losses[i] + (period - 1) * (result.length > 0 ? losses.slice(Math.max(0, i - period), i).reduce((a, b) => a + b, 0) / period : 0)) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

export function calcMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(prices, fast);
  const emaSlow = calcEMA(prices, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calcEMA(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

export function calcBollinger(prices: number[], period = 20, stdDevMultiplier = 2) {
  const sma = calcSMA(prices, period);
  return prices.map((_, i) => {
    if (i < period - 1) return { upper: NaN, middle: NaN, lower: NaN };
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      upper: mean + stdDevMultiplier * stdDev,
      middle: mean,
      lower: mean - stdDevMultiplier * stdDev,
    };
  });
}

export function calcStochastic(candles: OHLCV[], kPeriod = 14, dPeriod = 3) {
  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...slice.map(c => c.high));
    const lowestLow = Math.min(...slice.map(c => c.low));
    const k = lowestLow === highestHigh ? 0 : ((candles[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k);
  }
  const dValues = calcSMA(kValues, dPeriod);
  return { k: kValues, d: dValues };
}

export function calcATR(candles: OHLCV[], period = 14): number[] {
  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
  return calcSMA(trueRanges, period);
}

export function calcOBV(candles: OHLCV[]): number[] {
  const obv: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) {
      obv.push(obv[i - 1] + candles[i].volume);
    } else if (candles[i].close < candles[i - 1].close) {
      obv.push(obv[i - 1] - candles[i].volume);
    } else {
      obv.push(obv[i - 1]);
    }
  }
  return obv;
}

export function calcADX(candles: OHLCV[], period = 14): number[] {
  const adx: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const prevClose = candles[i - 1].close;
    tr.push(Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - prevClose), Math.abs(candles[i].low - prevClose)));
  }

  const smoothedTR = calcSMA(tr, period);
  const smoothedPlusDM = calcSMA(plusDM, period);
  const smoothedMinusDM = calcSMA(minusDM, period);

  for (let i = 0; i < smoothedTR.length; i++) {
    if (isNaN(smoothedTR[i])) { adx.push(NaN); continue; }
    const plusDI = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
    const minusDI = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    adx.push(dx);
  }

  return calcSMA(adx.filter(v => !isNaN(v)), period);
}

export function calcCCI(candles: OHLCV[], period = 20): number[] {
  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
  const sma = calcSMA(typicalPrices, period);
  return typicalPrices.map((tp, i) => {
    if (i < period - 1) return NaN;
    const slice = typicalPrices.slice(i - period + 1, i + 1);
    const meanDev = slice.reduce((acc, val) => acc + Math.abs(val - sma[i]), 0) / period;
    return meanDev === 0 ? 0 : (tp - sma[i]) / (0.015 * meanDev);
  });
}

export function calcMFI(candles: OHLCV[], period = 14): number[] {
  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
  const moneyFlows = typicalPrices.map((tp, i) => ({ tp, mf: tp * candles[i].volume }));

  const result: number[] = [];
  for (let i = period; i < candles.length; i++) {
    const slice = moneyFlows.slice(i - period, i);
    let posFlow = 0, negFlow = 0;
    for (let j = 1; j < slice.length; j++) {
      if (slice[j].tp > slice[j - 1].tp) posFlow += slice[j].mf;
      else negFlow += slice[j].mf;
    }
    const mfr = negFlow === 0 ? 100 : posFlow / negFlow;
    result.push(100 - 100 / (1 + mfr));
  }
  return result;
}

// ── CANDLE PATTERN RECOGNITION ──────────────────────────────────────────────

export function detectCandlePattern(candles: OHLCV[]): CandlePattern | null {
  if (candles.length < 3) return null;
  const [c3, c2, c1] = candles.slice(-3);
  const body1 = Math.abs(c1.close - c1.open);
  const body2 = Math.abs(c2.close - c2.open);
  const range1 = c1.high - c1.low;
  const upperWick1 = c1.high - Math.max(c1.open, c1.close);
  const lowerWick1 = Math.min(c1.open, c1.close) - c1.low;
  const isBull1 = c1.close > c1.open;
  const isBear1 = c1.close < c1.open;
  const isBull2 = c2.close > c2.open;
  const isBear2 = c2.close < c2.open;

  // Doji
  if (body1 / range1 < 0.1) {
    if (upperWick1 > body1 * 3 && lowerWick1 > body1 * 3) {
      return { name: 'Doji', type: 'neutral', description: 'Market indecision, possible reversal', reliability: 'medium' };
    }
    if (lowerWick1 > body1 * 2 && upperWick1 < body1) {
      return { name: 'Dragonfly Doji', type: 'bullish', description: 'Bullish reversal at support', reliability: 'high' };
    }
    if (upperWick1 > body1 * 2 && lowerWick1 < body1) {
      return { name: 'Gravestone Doji', type: 'bearish', description: 'Bearish reversal at resistance', reliability: 'high' };
    }
  }

  // Hammer / Hanging Man
  if (lowerWick1 > body1 * 2 && upperWick1 < body1 * 0.3) {
    return { name: 'Hammer', type: 'bullish', description: 'Bullish reversal signal after downtrend', reliability: 'high' };
  }

  // Shooting Star / Inverted Hammer
  if (upperWick1 > body1 * 2 && lowerWick1 < body1 * 0.3) {
    return { name: isBear1 ? 'Shooting Star' : 'Inverted Hammer', type: isBear1 ? 'bearish' : 'bullish', description: isBear1 ? 'Bearish reversal at resistance' : 'Potential bullish reversal', reliability: 'high' };
  }

  // Marubozu
  if (body1 / range1 > 0.95) {
    return { name: isBull1 ? 'Bullish Marubozu' : 'Bearish Marubozu', type: isBull1 ? 'bullish' : 'bearish', description: isBull1 ? 'Strong bullish momentum, buyers in full control' : 'Strong bearish momentum, sellers in full control', reliability: 'high' };
  }

  // Engulfing
  if (isBull1 && isBear2 && c1.open < c2.close && c1.close > c2.open && body1 > body2) {
    return { name: 'Bullish Engulfing', type: 'bullish', description: 'Strong bullish reversal signal', reliability: 'high' };
  }
  if (isBear1 && isBull2 && c1.open > c2.close && c1.close < c2.open && body1 > body2) {
    return { name: 'Bearish Engulfing', type: 'bearish', description: 'Strong bearish reversal signal', reliability: 'high' };
  }

  // Harami
  if (isBull1 && isBear2 && c1.open > c2.close && c1.close < c2.open && body1 < body2 * 0.5) {
    return { name: 'Bullish Harami', type: 'bullish', description: 'Potential bullish reversal', reliability: 'medium' };
  }
  if (isBear1 && isBull2 && c1.open < c2.close && c1.close > c2.open && body1 < body2 * 0.5) {
    return { name: 'Bearish Harami', type: 'bearish', description: 'Potential bearish reversal', reliability: 'medium' };
  }

  // Morning/Evening Star (3-candle)
  if (c3 && isBear2 && isBull1 && Math.abs(c2.close - c2.open) / (c2.high - c2.low) < 0.3 && c1.close > (c3.open + c3.close) / 2 && c3.open > c3.close) {
    return { name: 'Morning Star', type: 'bullish', description: 'Strong bullish reversal, 3-candle pattern', reliability: 'high' };
  }
  if (c3 && isBull2 && isBear1 && Math.abs(c2.close - c2.open) / (c2.high - c2.low) < 0.3 && c1.close < (c3.open + c3.close) / 2 && c3.close > c3.open) {
    return { name: 'Evening Star', type: 'bearish', description: 'Strong bearish reversal, 3-candle pattern', reliability: 'high' };
  }

  // Piercing Line
  if (isBull1 && isBear2 && c1.open < c2.low && c1.close > (c2.open + c2.close) / 2) {
    return { name: 'Piercing Line', type: 'bullish', description: 'Bullish reversal after downtrend', reliability: 'medium' };
  }

  // Dark Cloud Cover
  if (isBear1 && isBull2 && c1.open > c2.high && c1.close < (c2.open + c2.close) / 2) {
    return { name: 'Dark Cloud Cover', type: 'bearish', description: 'Bearish reversal after uptrend', reliability: 'medium' };
  }

  // Spinning Top
  if (body1 / range1 < 0.3 && upperWick1 > body1 && lowerWick1 > body1) {
    return { name: 'Spinning Top', type: 'neutral', description: 'Indecision, trend may continue or reverse', reliability: 'low' };
  }

  return { name: isBull1 ? 'Bullish Candle' : 'Bearish Candle', type: isBull1 ? 'bullish' : 'bearish', description: isBull1 ? 'Mild bullish candle' : 'Mild bearish candle', reliability: 'low' };
}

// ── SCORING ENGINE ──────────────────────────────────────────────────────────

export function calculateScore(indicators: TechnicalIndicators, candlePattern: CandlePattern | null, priceData: { price: number; ema20?: number; ema50?: number; ema200?: number }): { score: number; signal: ScreenerResult['signal'] } {
  let score = 50; // neutral baseline
  const weights = { rsi: 15, macd: 20, ema: 20, candle: 15, bollinger: 10, stochastic: 10, momentum: 10 };

  // RSI scoring
  if (indicators.rsi !== null) {
    const rsi = indicators.rsi;
    if (rsi < 30) score += weights.rsi * 0.8;
    else if (rsi < 40) score += weights.rsi * 0.4;
    else if (rsi > 70) score -= weights.rsi * 0.8;
    else if (rsi > 60) score -= weights.rsi * 0.4;
    else score += weights.rsi * 0.1;
  }

  // MACD scoring
  if (indicators.macd) {
    const { histogram, value, signal } = indicators.macd;
    if (histogram > 0 && value > signal) score += weights.macd * 0.6;
    else if (histogram > 0) score += weights.macd * 0.3;
    else if (histogram < 0 && value < signal) score -= weights.macd * 0.6;
    else score -= weights.macd * 0.3;
  }

  // EMA scoring
  if (priceData.ema20 && priceData.ema50 && priceData.ema200) {
    const { price, ema20, ema50, ema200 } = priceData;
    if (price > ema20 && price > ema50 && price > ema200) score += weights.ema;
    else if (price > ema20 && price > ema50) score += weights.ema * 0.6;
    else if (price > ema20) score += weights.ema * 0.3;
    else if (price < ema20 && price < ema50 && price < ema200) score -= weights.ema;
    else if (price < ema20 && price < ema50) score -= weights.ema * 0.6;
    else score -= weights.ema * 0.3;
  }

  // Candle pattern scoring
  if (candlePattern) {
    const mult = candlePattern.reliability === 'high' ? 1 : candlePattern.reliability === 'medium' ? 0.6 : 0.3;
    if (candlePattern.type === 'bullish') score += weights.candle * mult;
    else if (candlePattern.type === 'bearish') score -= weights.candle * mult;
  }

  // Stochastic scoring
  if (indicators.stochastic) {
    const { k, d } = indicators.stochastic;
    if (k < 20 && d < 20) score += weights.stochastic * 0.8;
    else if (k > 80 && d > 80) score -= weights.stochastic * 0.8;
    else if (k > d) score += weights.stochastic * 0.2;
    else score -= weights.stochastic * 0.2;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let signal: ScreenerResult['signal'];
  if (score >= 75) signal = 'STRONG_BUY';
  else if (score >= 60) signal = 'BUY';
  else if (score >= 40) signal = 'NEUTRAL';
  else if (score >= 25) signal = 'SELL';
  else signal = 'STRONG_SELL';

  return { score: Math.round(score), signal };
}

// ── DATA GENERATORS (Demo/Fallback) ─────────────────────────────────────────

export function generateMockOHLCV(basePrice: number, days: number): OHLCV[] {
  const candles: OHLCV[] = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    price = Math.max(price + change, 1);
    const high = Math.max(open, price) * (1 + Math.random() * 0.015);
    const low = Math.min(open, price) * (1 - Math.random() * 0.015);
    const volume = Math.floor(Math.random() * 10000000 + 1000000);
    candles.push({
      time: Math.floor((now - i * 86400000) / 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume,
    });
  }
  return candles;
}

export const IDX_STOCKS = [
  { symbol: 'BBCA', name: 'Bank Central Asia', sector: 'Financials', basePrice: 9500 },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Financials', basePrice: 4800 },
  { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecom', basePrice: 3600 },
  { symbol: 'ASII', name: 'Astra International', sector: 'Industrials', basePrice: 5200 },
  { symbol: 'BMRI', name: 'Bank Mandiri', sector: 'Financials', basePrice: 6100 },
  { symbol: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer', basePrice: 2400 },
  { symbol: 'ICBP', name: 'Indofood CBP', sector: 'Consumer', basePrice: 9200 },
  { symbol: 'GGRM', name: 'Gudang Garam', sector: 'Consumer', basePrice: 24000 },
  { symbol: 'HMSP', name: 'HM Sampoerna', sector: 'Consumer', basePrice: 900 },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy', basePrice: 1600 },
  { symbol: 'PTBA', name: 'Bukit Asam', sector: 'Energy', basePrice: 2800 },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold', sector: 'Materials', basePrice: 2200 },
  { symbol: 'ADRO', name: 'Adaro Energy', sector: 'Energy', basePrice: 1900 },
  { symbol: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer', basePrice: 6700 },
  { symbol: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare', basePrice: 1500 },
  { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Materials', basePrice: 1650 },
  { symbol: 'ITMG', name: 'Indo Tambangraya Megah', sector: 'Energy', basePrice: 26000 },
  { symbol: 'SIDO', name: 'Industri Jamu Sido Muncul', sector: 'Healthcare', basePrice: 680 },
  { symbol: 'CPIN', name: 'Charoen Pokphand Indonesia', sector: 'Consumer', basePrice: 5000 },
  { symbol: 'SMGR', name: 'Semen Indonesia', sector: 'Materials', basePrice: 6200 },
];

export const US_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 185 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', basePrice: 420 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', basePrice: 175 },
  { symbol: 'AMZN', name: 'Amazon.com', sector: 'Consumer', basePrice: 185 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', basePrice: 875 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Technology', basePrice: 510 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer', basePrice: 175 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', basePrice: 395 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', basePrice: 195 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', basePrice: 275 },
];

export function generateScreenerData(stocks: typeof IDX_STOCKS): ScreenerResult[] {
  return stocks.map(stock => {
    const candles = generateMockOHLCV(stock.basePrice, 200);
    const closes = candles.map(c => c.close);
    const lastCandle = candles[candles.length - 1];

    const rsiArr = calcRSI(closes);
    const macdData = calcMACD(closes);
    const ema20Arr = calcEMA(closes, 20);
    const ema50Arr = calcEMA(closes, 50);
    const ema200Arr = calcEMA(closes, 200);
    const bollingerArr = calcBollinger(closes);
    const stochData = calcStochastic(candles);
    const atrArr = calcATR(candles);
    const obvArr = calcOBV(candles);
    const adxArr = calcADX(candles);
    const cciArr = calcCCI(candles);
    const mfiArr = calcMFI(candles);

    const lastRSI = rsiArr[rsiArr.length - 1];
    const lastMACD = {
      value: macdData.macdLine[macdData.macdLine.length - 1],
      signal: macdData.signalLine[macdData.signalLine.length - 1],
      histogram: macdData.histogram[macdData.histogram.length - 1],
    };
    const lastEMA20 = ema20Arr[ema20Arr.length - 1];
    const lastEMA50 = ema50Arr[ema50Arr.length - 1];
    const lastEMA200 = ema200Arr[ema200Arr.length - 1];
    const lastBB = bollingerArr[bollingerArr.length - 1];
    const lastK = stochData.k[stochData.k.length - 1];
    const lastD = stochData.d[stochData.d.length - 1];

    const candlePattern = detectCandlePattern(candles.slice(-3));
    const change = lastCandle.close - candles[candles.length - 2].close;
    const changePercent = (change / candles[candles.length - 2].close) * 100;

    const indicators: TechnicalIndicators = {
      rsi: isNaN(lastRSI) ? null : parseFloat(lastRSI.toFixed(2)),
      macd: { value: parseFloat(lastMACD.value.toFixed(4)), signal: parseFloat(lastMACD.signal.toFixed(4)), histogram: parseFloat(lastMACD.histogram.toFixed(4)) },
      ema20: parseFloat(lastEMA20.toFixed(2)),
      ema50: parseFloat(lastEMA50.toFixed(2)),
      ema200: parseFloat(lastEMA200.toFixed(2)),
      sma20: parseFloat((calcSMA(closes, 20)[closes.length - 1] || 0).toFixed(2)),
      bollinger: isNaN(lastBB.upper) ? null : { upper: parseFloat(lastBB.upper.toFixed(2)), middle: parseFloat(lastBB.middle.toFixed(2)), lower: parseFloat(lastBB.lower.toFixed(2)) },
      stochastic: { k: parseFloat(lastK.toFixed(2)), d: parseFloat(lastD.toFixed(2)) },
      atr: parseFloat((atrArr[atrArr.length - 1] || 0).toFixed(2)),
      obv: obvArr[obvArr.length - 1],
      vwap: parseFloat(((lastCandle.high + lastCandle.low + lastCandle.close) / 3).toFixed(2)),
      adx: adxArr.length > 0 ? parseFloat(adxArr[adxArr.length - 1].toFixed(2)) : null,
      williamsR: lastK !== undefined ? parseFloat((lastK - 100).toFixed(2)) : null,
      cci: cciArr.length > 0 ? parseFloat(cciArr[cciArr.length - 1].toFixed(2)) : null,
      mfi: mfiArr.length > 0 ? parseFloat(mfiArr[mfiArr.length - 1].toFixed(2)) : null,
    };

    const { score, signal } = calculateScore(indicators, candlePattern, {
      price: lastCandle.close,
      ema20: lastEMA20,
      ema50: lastEMA50,
      ema200: lastEMA200,
    });

    const allTimeHigh = Math.max(...closes) * 1.05;
    const allTimeLow = Math.min(...closes) * 0.95;

    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      price: lastCandle.close,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: lastCandle.volume,
      high52w: parseFloat((allTimeHigh).toFixed(2)),
      low52w: parseFloat((allTimeLow).toFixed(2)),
      pe: parseFloat((Math.random() * 25 + 5).toFixed(1)),
      eps: parseFloat((lastCandle.close / (Math.random() * 20 + 5)).toFixed(2)),
      beta: parseFloat((Math.random() * 1.5 + 0.3).toFixed(2)),
      marketCap: Math.floor(lastCandle.close * (Math.random() * 10000000000 + 1000000000)),
      indicators,
      candlePattern,
      signal,
      score,
      priceHistory: candles,
    };
  });
}

export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(decimals);
}

export function formatIDR(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}
