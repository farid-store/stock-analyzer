// pages/api/stock/[symbol].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateMockOHLCV, detectCandlePattern, calcRSI, calcMACD, calcEMA, calcBollinger, calcStochastic, calcATR, calcOBV, calcADX, calcCCI, calcMFI, calcSMA } from '../../../lib/stockUtils';

const IDX_MAP: Record<string, { name: string; sector: string; basePrice: number }> = {
  BBCA: { name: 'Bank Central Asia', sector: 'Financials', basePrice: 9500 },
  BBRI: { name: 'Bank Rakyat Indonesia', sector: 'Financials', basePrice: 4800 },
  TLKM: { name: 'Telkom Indonesia', sector: 'Telecom', basePrice: 3600 },
  ASII: { name: 'Astra International', sector: 'Industrials', basePrice: 5200 },
  BMRI: { name: 'Bank Mandiri', sector: 'Financials', basePrice: 6100 },
  UNVR: { name: 'Unilever Indonesia', sector: 'Consumer', basePrice: 2400 },
  ICBP: { name: 'Indofood CBP', sector: 'Consumer', basePrice: 9200 },
  GGRM: { name: 'Gudang Garam', sector: 'Consumer', basePrice: 24000 },
  HMSP: { name: 'HM Sampoerna', sector: 'Consumer', basePrice: 900 },
  PGAS: { name: 'Perusahaan Gas Negara', sector: 'Energy', basePrice: 1600 },
  PTBA: { name: 'Bukit Asam', sector: 'Energy', basePrice: 2800 },
  MDKA: { name: 'Merdeka Copper Gold', sector: 'Materials', basePrice: 2200 },
  ADRO: { name: 'Adaro Energy', sector: 'Energy', basePrice: 1900 },
  INDF: { name: 'Indofood Sukses Makmur', sector: 'Consumer', basePrice: 6700 },
  KLBF: { name: 'Kalbe Farma', sector: 'Healthcare', basePrice: 1500 },
  ANTM: { name: 'Aneka Tambang', sector: 'Materials', basePrice: 1650 },
  ITMG: { name: 'Indo Tambangraya Megah', sector: 'Energy', basePrice: 26000 },
  SIDO: { name: 'Industri Jamu Sido Muncul', sector: 'Healthcare', basePrice: 680 },
  CPIN: { name: 'Charoen Pokphand Indonesia', sector: 'Consumer', basePrice: 5000 },
  SMGR: { name: 'Semen Indonesia', sector: 'Materials', basePrice: 6200 },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol required' });
  }

  const sym = symbol.toUpperCase();
  const stockInfo = IDX_MAP[sym] || { name: sym, sector: 'Unknown', basePrice: 1000 };

  try {
    // Try Alpha Vantage first
    const apiKey = process.env.ALPHA_VANTAGE_KEY;
    let candles = null;
    
    if (apiKey && apiKey !== 'demo') {
      try {
        const avSymbol = Object.keys(IDX_MAP).includes(sym) ? `${sym}.JK` : sym;
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${avSymbol}&outputsize=full&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Time Series (Daily)']) {
          const timeSeries = data['Time Series (Daily)'];
          candles = Object.entries(timeSeries)
            .slice(0, 200)
            .reverse()
            .map(([date, values]: [string, any]) => ({
              time: Math.floor(new Date(date).getTime() / 1000),
              open: parseFloat(values['1. open']),
              high: parseFloat(values['2. high']),
              low: parseFloat(values['3. low']),
              close: parseFloat(values['4. close']),
              volume: parseInt(values['6. volume']),
            }));
        }
      } catch (e) {
        console.log('Alpha Vantage fetch failed, using mock data');
      }
    }

    // Fallback to generated data
    if (!candles || candles.length < 50) {
      candles = generateMockOHLCV(stockInfo.basePrice, 200);
    }

    const closes = candles.map((c: any) => c.close);
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];

    // Calculate all indicators
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

    const lastBB = bollingerArr[bollingerArr.length - 1];

    const indicators = {
      rsi: rsiArr[rsiArr.length - 1] || null,
      macd: {
        value: macdData.macdLine[macdData.macdLine.length - 1],
        signal: macdData.signalLine[macdData.signalLine.length - 1],
        histogram: macdData.histogram[macdData.histogram.length - 1],
        history: macdData.histogram.slice(-50),
      },
      ema20: ema20Arr[ema20Arr.length - 1],
      ema50: ema50Arr[ema50Arr.length - 1],
      ema200: ema200Arr[ema200Arr.length - 1],
      sma20: calcSMA(closes, 20)[closes.length - 1],
      sma50: calcSMA(closes, 50)[closes.length - 1],
      bollinger: isNaN(lastBB.upper) ? null : lastBB,
      stochastic: {
        k: stochData.k[stochData.k.length - 1],
        d: stochData.d[stochData.d.length - 1],
        history: stochData.k.slice(-50),
      },
      atr: atrArr[atrArr.length - 1],
      obv: obvArr[obvArr.length - 1],
      vwap: (lastCandle.high + lastCandle.low + lastCandle.close) / 3,
      adx: adxArr.length > 0 ? adxArr[adxArr.length - 1] : null,
      williamsR: stochData.k.length > 0 ? stochData.k[stochData.k.length - 1] - 100 : null,
      cci: cciArr.length > 0 ? cciArr[cciArr.length - 1] : null,
      mfi: mfiArr.length > 0 ? mfiArr[mfiArr.length - 1] : null,
      rsiHistory: rsiArr.slice(-50),
    };

    const candlePattern = detectCandlePattern(candles.slice(-3));
    const change = lastCandle.close - prevCandle.close;
    const changePercent = (change / prevCandle.close) * 100;
    
    const allCloses = closes;
    const high52w = Math.max(...allCloses.slice(-252));
    const low52w = Math.min(...allCloses.slice(-252));

    res.status(200).json({
      symbol: sym,
      name: stockInfo.name,
      sector: stockInfo.sector,
      price: lastCandle.close,
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: lastCandle.close,
      volume: lastCandle.volume,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      high52w: parseFloat(high52w.toFixed(2)),
      low52w: parseFloat(low52w.toFixed(2)),
      pe: parseFloat((Math.random() * 20 + 8).toFixed(1)),
      eps: parseFloat((lastCandle.close / (Math.random() * 15 + 8)).toFixed(2)),
      beta: parseFloat((Math.random() * 1.2 + 0.4).toFixed(2)),
      marketCap: Math.floor(lastCandle.close * (Math.random() * 5000000000 + 500000000)),
      indicators,
      candlePattern,
      candles: candles.slice(-100),
      supportLevels: [
        parseFloat((lastCandle.close * 0.95).toFixed(2)),
        parseFloat((lastCandle.close * 0.90).toFixed(2)),
        parseFloat((lastCandle.close * 0.85).toFixed(2)),
      ],
      resistanceLevels: [
        parseFloat((lastCandle.close * 1.05).toFixed(2)),
        parseFloat((lastCandle.close * 1.10).toFixed(2)),
        parseFloat((lastCandle.close * 1.15).toFixed(2)),
      ],
    });
  } catch (error) {
    console.error('Stock API error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
