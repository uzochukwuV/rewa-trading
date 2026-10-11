const { createHmac } = require('node:crypto');

const BINANCE_BASE = 'https://web3.binance.com/build';
const CHAIN_ID = '56';
const RWA_TOKENS_PATH = '/api/v1/dex/market/rwa/tokens';
const RWA_PRICE_PATH = '/api/v1/dex/market/rwa/price';
const RWA_PORTFOLIO_PNL_PATH = '/api/v1/dex/market/portfolio/recent-pnl';

function buildQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

async function signedGet(path, params) {
  const apiKey = process.env.BINANCE_WEB3_API_KEY;
  const secretKey = process.env.BINANCE_WEB3_SECRET_KEY;
  if (!apiKey || !secretKey) {
    const error = new Error('Binance Web3 API credentials are not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  const query = buildQuery(params);
  const requestPath = `/build${path}${query ? `?${query}` : ''}`;
  const timestamp = new Date().toISOString();
  const signature = createHmac('sha256', secretKey)
    .update(`${timestamp}GET${requestPath}`, 'utf8')
    .digest('base64');
  const response = await fetch(`${BINANCE_BASE}${path}${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: {
      'X-OC-APIKEY': apiKey,
      'X-OC-TIMESTAMP': timestamp,
      'X-OC-SIGN': signature,
      'X-OC-RECV-WINDOW': '5000',
    },
    signal: AbortSignal.timeout(10000),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || Number(payload.code) !== 0 || payload.data == null) {
    const error = new Error(`Binance RWA request failed (${response.status || 'invalid response'}).`);
    error.statusCode = response.status >= 500 ? 502 : response.status || 502;
    throw error;
  }
  return payload.data;
}

function toMarket(token) {
  const ticker = String(token.underlyingTicker || token.tokenSymbol || '').trim();
  const symbol = String(token.tokenSymbol || '').trim();
  const price = Number(token.tokenPrice);
  const referencePrice = Number(token.referencePrice);
  if (!ticker || !symbol || !Number.isFinite(price) || price <= 0) return null;

  return {
    ticker,
    symbol,
    name: String(token.underlyingName || token.tokenName || ticker),
    provider: token.platformId === 'bstock' ? 'bStock' : 'Ondo',
    contractAddress: String(token.tokenContractAddress || ''),
    chainId: CHAIN_ID,
    price,
    referencePrice: Number.isFinite(referencePrice) && referencePrice > 0 ? referencePrice : price,
    referenceChange: Number.isFinite(referencePrice) && referencePrice > 0
      ? ((price - referencePrice) / referencePrice) * 100
      : 0,
    open: Boolean(token.statusInfo?.openState),
    marketStatus: token.statusInfo?.marketStatus || token.statusInfo?.reasonCode || 'Unknown',
    category: 'Tokenized equity',
    badge: ticker.slice(0, 1).toUpperCase(),
  };
}

async function getRwaMarkets() {
  const tokens = await signedGet(RWA_TOKENS_PATH, { binanceChainId: CHAIN_ID });
  const eligibleTokens = tokens.filter((token) =>
    String(token.binanceChainId) === CHAIN_ID && [1, 3].includes(Number(token.assetType))
  );
  const prices = new Map();

  for (let offset = 0; offset < eligibleTokens.length; offset += 100) {
    const batch = eligibleTokens.slice(offset, offset + 100);
    const addresses = batch.map((token) => token.tokenContractAddress).filter(Boolean);
    if (!addresses.length) continue;
    try {
      const rows = await signedGet(RWA_PRICE_PATH, {
        binanceChainId: CHAIN_ID,
        tokenContractAddresses: addresses.join(','),
      });
      rows.forEach((price) => {
        const address = String(price.tokenContractAddress || '').toLowerCase();
        if (address) prices.set(address, price);
      });
    } catch {
      // Token-list prices remain usable if the optional price refresh is unavailable.
    }
  }

  const markets = eligibleTokens.map((token) => {
    const price = prices.get(String(token.tokenContractAddress || '').toLowerCase());
    return toMarket(price ? { ...token, ...price } : token);
  }).filter(Boolean);

  if (!markets.length) throw new Error('Binance returned no usable BNB Chain RWA tokens.');
  return markets;
}

async function getRwaPortfolio(walletAddress) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    const error = new Error('A valid BNB Smart Chain wallet address is required.');
    error.statusCode = 400;
    throw error;
  }

  const pnlList = [];
  let cursor = '';
  for (let page = 0; page < 10; page += 1) {
    const data = await signedGet(RWA_PORTFOLIO_PNL_PATH, {
      binanceChainId: CHAIN_ID,
      walletAddress: walletAddress.toLowerCase(),
      cursor,
      limit: 100,
    });
    if (!data || !Array.isArray(data.pnlList)) {
      throw new Error('Binance returned an invalid portfolio response.');
    }
    pnlList.push(...data.pnlList);
    cursor = String(data.cursor || '');
    if (!cursor) break;
  }
  return pnlList;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  });
  response.end(JSON.stringify(payload));
}

async function handleBinanceRequest(request, response, routedPath) {
  const requestUrl = new URL(routedPath || request.url || '/', 'http://localhost');
  const isMarketsRoute = requestUrl.pathname === '/api/binance/rwa/markets';
  const isPortfolioRoute = requestUrl.pathname === '/api/binance/rwa/portfolio';
  if (!isMarketsRoute && !isPortfolioRoute) return false;
  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed.' });
    return true;
  }

  try {
    if (isPortfolioRoute) {
      const walletAddress = requestUrl.searchParams.get('walletAddress') || '';
      const portfolio = await getRwaPortfolio(walletAddress);
      sendJson(response, 200, {
        source: 'binance',
        walletAddress: walletAddress.toLowerCase(),
        positions: portfolio,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    const markets = await getRwaMarkets();
    sendJson(response, 200, { source: 'binance', markets, updatedAt: new Date().toISOString() });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 502;
    sendJson(response, statusCode, { error: error?.message || 'Binance market data is unavailable.' });
  }
  return true;
}

module.exports = { handleBinanceRequest };
