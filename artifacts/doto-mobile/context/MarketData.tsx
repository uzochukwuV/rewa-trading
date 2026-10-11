import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Market, MARKET_DATA } from '@/data/market';
import { fetchBinanceMarkets } from '@/data/market-api';

type MarketDataSource = 'mock' | 'binance';
interface MarketDataValue {
  markets: Market[];
  source: MarketDataSource;
  refresh: () => Promise<void>;
}

const MarketDataContext = createContext<MarketDataValue | null>(null);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(MARKET_DATA);
  const [source, setSource] = useState<MarketDataSource>('mock');
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const liveMarkets = await fetchBinanceMarkets();
      setMarkets(liveMarkets);
      setSource('binance');
    } catch {
      // Keep the fixture data available until signed Binance requests succeed.
    } finally {
      refreshing.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 300_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const value = useMemo(() => ({ markets, source, refresh }), [markets, source, refresh]);
  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

export function useMarketData() {
  const value = useContext(MarketDataContext);
  if (!value) throw new Error('useMarketData must be used within MarketDataProvider');
  return value;
}
