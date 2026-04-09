// lib/store.ts
import { create } from 'zustand';
import { ScreenerResult } from './stockUtils';

interface AppState {
  selectedStock: ScreenerResult | null;
  watchlist: string[];
  market: 'IDX' | 'US';
  telegramConfig: {
    botToken: string;
    chatId: string;
    enabled: boolean;
  };
  screenerResults: ScreenerResult[];
  isLoading: boolean;
  activeTab: string;
  alerts: Alert[];
  
  setSelectedStock: (stock: ScreenerResult | null) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setMarket: (market: 'IDX' | 'US') => void;
  setTelegramConfig: (config: Partial<AppState['telegramConfig']>) => void;
  setScreenerResults: (results: ScreenerResult[]) => void;
  setIsLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
}

interface Alert {
  id: string;
  symbol: string;
  type: 'above' | 'below' | 'signal' | 'rsi';
  value: number;
  message: string;
  triggered: boolean;
  createdAt: Date;
}

export const useStore = create<AppState>((set) => ({
  selectedStock: null,
  watchlist: ['BBCA', 'BBRI', 'TLKM', 'ASII'],
  market: 'IDX',
  telegramConfig: {
    botToken: '',
    chatId: '',
    enabled: false,
  },
  screenerResults: [],
  isLoading: false,
  activeTab: 'screener',
  alerts: [],

  setSelectedStock: (stock) => set({ selectedStock: stock }),
  addToWatchlist: (symbol) => set((state) => ({
    watchlist: state.watchlist.includes(symbol) ? state.watchlist : [...state.watchlist, symbol],
  })),
  removeFromWatchlist: (symbol) => set((state) => ({
    watchlist: state.watchlist.filter((s) => s !== symbol),
  })),
  setMarket: (market) => set({ market }),
  setTelegramConfig: (config) => set((state) => ({
    telegramConfig: { ...state.telegramConfig, ...config },
  })),
  setScreenerResults: (results) => set({ screenerResults: results }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
}));
