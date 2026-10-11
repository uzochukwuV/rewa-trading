import Constants from 'expo-constants';
import { Market } from '@/data/market';

type MarketResponse = { source: 'binance'; markets: Market[] };

function apiBaseUrl() {
  const explicitUrl = process.env.EXPO_PUBLIC_BINANCE_API_URL;
  if (explicitUrl) return explicitUrl.replace(/\/$/, '');

  const publicDomain = process.env.EXPO_PUBLIC_DOMAIN;
  if (publicDomain) return `https://${publicDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.replace(/^https?:\/\//, '').split('/')[0];
    return `${hostUri.startsWith('https://') ? 'https' : 'http'}://${host}`;
  }

  if (typeof window !== 'undefined') return window.location.origin;
  return null;
}

export async function fetchBinanceMarkets(): Promise<Market[]> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error('Binance market proxy URL is not configured.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch(`${baseUrl}/api/binance/rwa/markets`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Binance market data unavailable (${response.status}).`);

    const payload = await response.json() as MarketResponse;
    if (payload.source !== 'binance' || !Array.isArray(payload.markets) || !payload.markets.length) {
      throw new Error('Binance market data response was invalid.');
    }
    return payload.markets;
  } finally {
    clearTimeout(timeout);
  }
}

