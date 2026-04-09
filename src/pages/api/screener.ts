// pages/api/screener.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { IDX_STOCKS, US_STOCKS, generateScreenerData } from '../../lib/stockUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { market = 'IDX', minScore, maxScore, signal, sector, minRSI, maxRSI, minVolume, sortBy = 'score', sortDir = 'desc' } = req.query;

  try {
    const stocks = market === 'US' ? US_STOCKS : IDX_STOCKS;
    let results = generateScreenerData(stocks);

    // Apply filters
    if (minScore) results = results.filter(s => s.score >= Number(minScore));
    if (maxScore) results = results.filter(s => s.score <= Number(maxScore));
    if (signal) results = results.filter(s => s.signal === signal);
    if (sector) results = results.filter(s => s.sector === sector);
    if (minRSI && s => s.indicators.rsi !== null) results = results.filter(s => s.indicators.rsi !== null && s.indicators.rsi >= Number(minRSI));
    if (maxRSI) results = results.filter(s => s.indicators.rsi !== null && s.indicators.rsi <= Number(maxRSI));
    if (minVolume) results = results.filter(s => s.volume >= Number(minVolume));

    // Sort
    results.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'score': aVal = a.score; bVal = b.score; break;
        case 'changePercent': aVal = a.changePercent; bVal = b.changePercent; break;
        case 'volume': aVal = a.volume; bVal = b.volume; break;
        case 'price': aVal = a.price; bVal = b.price; break;
        case 'rsi': aVal = a.indicators.rsi || 0; bVal = b.indicators.rsi || 0; break;
        default: aVal = a.score; bVal = b.score;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    res.status(200).json({
      results,
      total: results.length,
      market,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Screener error:', error);
    res.status(500).json({ error: 'Screener failed' });
  }
}
