import { apiBaseUrl } from '@/data/market-api';

export type TradeToken = {
  address: string;
  symbol: string;
  decimals: number;
};

export type BinanceQuote = {
  quoteId: string;
  vendorName: string;
  executionMode: 'SWAP' | 'RFQ';
  fromTokenAmount: string;
  toTokenAmount: string;
  tradeFee?: string | null;
  estimateGasFee?: string | null;
  priceImpactPercent?: string | null;
  router?: string;
  approveTarget?: string | null;
  fromToken?: { tokenSymbol?: string; decimal?: string; tokenContractAddress?: string };
  toToken?: { tokenSymbol?: string; decimal?: string; tokenContractAddress?: string };
  rfq?: Record<string, unknown>;
  tx?: Record<string, string>;
  [key: string]: unknown;
};

export type BinanceTradeResponse<T> = { data: T };

async function request<T>(path: string, token: string, body?: unknown): Promise<T> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) throw new Error('Trading server URL is not configured.');
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null) as ({ error?: string; data?: T } | null);
  if (!response.ok) throw new Error(payload?.error || `Trade service unavailable (${response.status}).`);
  if (!payload || payload.data === undefined) throw new Error('Trade service returned an invalid response.');
  return payload.data;
}

export async function fetchQuote(args: {
  token: string;
  walletAddress: string;
  amount: string;
  from: TradeToken;
  to: TradeToken;
}): Promise<BinanceQuote[]> {
  const data = await request<BinanceQuote[] | BinanceQuote>('/api/binance/trading/quote', args.token, {
    walletAddress: args.walletAddress,
    amount: args.amount,
    fromTokenAddress: args.from.address,
    toTokenAddress: args.to.address,
  });
  return Array.isArray(data) ? data : [data];
}

export function buildSwap(args: {
  token: string;
  walletAddress: string;
  amount: string;
  from: TradeToken;
  to: TradeToken;
  quoteId: string;
  slippagePercent: string;
}): Promise<Record<string, any>> {
  return request('/api/binance/trading/swap', args.token, {
    walletAddress: args.walletAddress, amount: args.amount,
    fromTokenAddress: args.from.address, toTokenAddress: args.to.address,
    quoteId: args.quoteId, slippagePercent: args.slippagePercent,
  });
}

export function getApproval(token: string, tokenContractAddress: string, approveAmount: string, vendor?: string): Promise<Record<string, any>> {
  return request('/api/binance/trading/approve', token, { tokenContractAddress, approveAmount, vendor });
}

export function simulateTransaction(token: string, evmTx: Record<string, unknown>): Promise<Record<string, any>> {
  return request('/api/binance/trading/simulate', token, { evmTx });
}

export function broadcastTransaction(token: string, walletAddress: string, signedTransaction: string): Promise<{ txHash: string; orderId?: string }> {
  return request('/api/binance/trading/broadcast', token, { walletAddress, signedTransaction });
}

export function submitRfq(token: string, args: { requestId: string; userSignature: string; vendor: string; quoteId: string; signingScheme?: string }): Promise<{ orderId: string; [key: string]: unknown }> {
  return request('/api/binance/trading/rfq-submit', token, args);
}

export function getRfqStatus(token: string, orderId: string): Promise<Record<string, any>> {
  return request(`/api/binance/trading/rfq-status?orderId=${encodeURIComponent(orderId)}`, token);
}

export function getTransactionStatus(token: string, txHash: string): Promise<Record<string, any>> {
  return request(`/api/binance/trading/status?txHash=${encodeURIComponent(txHash)}`, token);
}

export function toBaseUnits(value: string, decimals: number): string {
  const normalized = value.trim();
  if (!/^\d*(\.\d*)?$/.test(normalized) || !normalized || normalized === '.') throw new Error('Enter a valid amount.');
  const [whole = '0', fraction = ''] = normalized.split('.');
  if (fraction.length > decimals) throw new Error(`This token supports up to ${decimals} decimal places.`);
  const units = `${whole || '0'}${fraction.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '');
  if (BigInt(units || '0') <= 0n) throw new Error('Enter an amount greater than zero.');
  return units || '0';
}

export function fromBaseUnits(value: string | number, decimals: number): string {
  const raw = String(value || '0').replace(/\D/g, '') || '0';
  const padded = raw.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals) || '0';
  const fraction = padded.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}
