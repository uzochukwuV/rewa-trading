import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { marketPrice } from '@/data/market';

export type PositionStatus = 'open' | 'pending' | 'closed';
export interface Position {
  id: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status: PositionStatus;
  createdAt: string;
}

interface AppData {
  hasOnboarded: boolean;
  userName: string;
  walletBalance: number;
  positions: Position[];
  favorites: string[];
  selectedSymbol: string;
}

interface AppStateValue extends AppData {
  ready: boolean;
  finishOnboarding: (name?: string) => void;
  signOut: () => void;
  toggleFavorite: (symbol: string) => void;
  setSelectedSymbol: (symbol: string) => void;
  openPosition: (symbol: string, side: 'Buy' | 'Sell', size: number, price?: number) => void;
  closePosition: (id: string, price?: number) => void;
  addFunds: (amount: number) => void;
  withdrawFunds: (amount: number) => boolean;
}

const STORAGE_KEY = '@doto-demo-state-v1';
const INITIAL_DATA: AppData = {
  hasOnboarded: false,
  userName: 'Victor Ezeanor',
  walletBalance: 8240.5,
  positions: [],
  favorites: ['NVDAB', 'NVDAon'],
  selectedSymbol: 'NVDAB',
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active || !saved) return;
        const parsed = JSON.parse(saved) as Partial<AppData>;
        setData({ ...INITIAL_DATA, ...parsed });
      })
      .catch((error: unknown) => {
        console.warn('Unable to restore the local demo session.', error);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback((patch: Partial<AppData>) => {
    setData((current) => {
      const next = { ...current, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error: unknown) => {
        console.warn('Unable to save the local demo session.', error);
      });
      return next;
    });
  }, []);

  const finishOnboarding = useCallback((name = 'Victor Ezeanor') => {
    update({ hasOnboarded: true, userName: name.trim() || 'Victor Ezeanor' });
  }, [update]);

  const signOut = useCallback(() => {
    update({ hasOnboarded: false });
  }, [update]);

  const toggleFavorite = useCallback((symbol: string) => {
    setData((current) => {
      const favorites = current.favorites.includes(symbol)
        ? current.favorites.filter((item) => item !== symbol)
        : [...current.favorites, symbol];
      const next = { ...current, favorites };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error: unknown) => {
        console.warn('Unable to save favorites.', error);
      });
      return next;
    });
  }, []);

  const setSelectedSymbol = useCallback((symbol: string) => {
    update({ selectedSymbol: symbol });
  }, [update]);

  const openPosition = useCallback((symbol: string, side: 'Buy' | 'Sell', size: number, currentPrice?: number) => {
    const price = currentPrice ?? marketPrice(symbol);
    const position: Position = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol,
      side,
      size,
      entryPrice: price,
      currentPrice: price,
      pnl: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setData((current) => {
      const next = { ...current, positions: [position, ...current.positions] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error: unknown) => {
        console.warn('Unable to save the simulated trade.', error);
      });
      return next;
    });
  }, []);

  const closePosition = useCallback((id: string, currentPrice?: number) => {
    setData((current) => {
      const positions = current.positions.map((position) =>
        position.id === id
          ? { ...position, status: 'closed' as const, currentPrice: currentPrice ?? marketPrice(position.symbol) }
          : position,
      );
      const next = { ...current, positions };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error: unknown) => {
        console.warn('Unable to update the simulated position.', error);
      });
      return next;
    });
  }, []);

  const addFunds = useCallback((amount: number) => {
    setData((current) => {
      const next = { ...current, walletBalance: current.walletBalance + amount };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error: unknown) => {
        console.warn('Unable to save the local wallet.', error);
      });
      return next;
    });
  }, []);

  const withdrawFunds = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0 || amount > data.walletBalance) return false;
    update({ walletBalance: data.walletBalance - amount });
    return true;
  }, [data.walletBalance, update]);

  const value = useMemo<AppStateValue>(() => ({
    ...data,
    ready,
    finishOnboarding,
    signOut,
    toggleFavorite,
    setSelectedSymbol,
    openPosition,
    closePosition,
    addFunds,
    withdrawFunds,
  }), [data, ready, finishOnboarding, signOut, toggleFavorite, setSelectedSymbol, openPosition, closePosition, addFunds, withdrawFunds]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used within AppStateProvider');
  return value;
}
