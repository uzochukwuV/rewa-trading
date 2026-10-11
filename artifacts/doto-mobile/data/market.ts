export interface Market {
  ticker: string;
  symbol: string;
  name: string;
  provider: 'bStock' | 'Ondo';
  contractAddress: string;
  chainId: '56';
  price: number;
  referencePrice: number;
  referenceChange: number;
  open: boolean;
  marketStatus: string;
  category: 'Tokenized equity';
  badge: string;
}

export const MARKET_DATA: Market[] = [
  { ticker: 'NVDA', symbol: 'NVDAB', name: 'Nvidia Corp', provider: 'bStock', contractAddress: '0x02fca66c1d1afb4e2a7884261eb00f63598a7436', chainId: '56', price: 235.9534818142, referencePrice: 235.77, referenceChange: 0.08, open: true, marketStatus: 'Trading', category: 'Tokenized equity', badge: 'N' },
  { ticker: 'NVDA', symbol: 'NVDAon', name: 'Nvidia Corp', provider: 'Ondo', contractAddress: '0xa9ee28c80f960b889dfbd1902055218cba016f75', chainId: '56', price: 236.431628092, referencePrice: 236.0267834358, referenceChange: 0.17, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'N' },
  { ticker: 'MSFT', symbol: 'MSFTB', name: 'Microsoft Corp', provider: 'bStock', contractAddress: '0x80106cb3ead06659a5ad19df39d9b4733863b9b0', chainId: '56', price: 531.8679387005, referencePrice: 531.17, referenceChange: 0.13, open: true, marketStatus: 'Trading', category: 'Tokenized equity', badge: 'M' },
  { ticker: 'MSFT', symbol: 'MSFTon', name: 'Microsoft Corp', provider: 'Ondo', contractAddress: '0x6bfe75d1ad432050ea973c3a3dcd88f02e2444c3', chainId: '56', price: 537.0176324675, referencePrice: 533.9575978872, referenceChange: 0.57, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'M' },
  { ticker: 'GOOGL', symbol: 'GOOGLB', name: 'Alphabet Inc.', provider: 'bStock', contractAddress: '0x3f53de71c126bdabae20f9cd64848d317f6c3238', chainId: '56', price: 349.3569334146, referencePrice: 349.19, referenceChange: 0.05, open: true, marketStatus: 'Trading', category: 'Tokenized equity', badge: 'G' },
  { ticker: 'GOOGL', symbol: 'GOOGLon', name: 'Alphabet Inc.', provider: 'Ondo', contractAddress: '0x091fc7778e6932d4009b087b191d1ee3bac5729a', chainId: '56', price: 350.7007580684, referencePrice: 349.8400373057, referenceChange: 0.25, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'G' },
  { ticker: 'TSLA', symbol: 'TSLAB', name: 'Tesla, Inc.', provider: 'bStock', contractAddress: '0x5b1910eaad6450e50f816082aa078c41f10c292f', chainId: '56', price: 372.06, referencePrice: 372.06, referenceChange: 0, open: true, marketStatus: 'Trading', category: 'Tokenized equity', badge: 'T' },
  { ticker: 'TSLA', symbol: 'TSLAon', name: 'Tesla, Inc.', provider: 'Ondo', contractAddress: '0x2494b603319d4d9f9715c9f4496d9e0364b59d93', chainId: '56', price: 371.953846, referencePrice: 371.953846, referenceChange: 0, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'T' },
  { ticker: 'META', symbol: 'METAB', name: 'Meta Platforms, Inc.', provider: 'bStock', contractAddress: '0x7425889fe94f9d693e8daefe88bcced6acfef4c0', chainId: '56', price: 721.0151090358, referencePrice: 720.62, referenceChange: 0.05, open: true, marketStatus: 'Trading', category: 'Tokenized equity', badge: 'M' },
  { ticker: 'META', symbol: 'METAon', name: 'Meta Platforms, Inc.', provider: 'Ondo', contractAddress: '0xd7df5863a3e742f0c767768cdfcb63f09e0422f6', chainId: '56', price: 724.3513967805, referencePrice: 722.3094868699, referenceChange: 0.28, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'M' },
  { ticker: 'AAPL', symbol: 'AAPLon', name: 'Apple Inc.', provider: 'Ondo', contractAddress: '0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4', chainId: '56', price: 340.3414503248, referencePrice: 339.1962986083, referenceChange: 0.34, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'A' },
  { ticker: 'AMZN', symbol: 'AMZNon', name: 'Amazon.com, Inc.', provider: 'Ondo', contractAddress: '0x4553cfe1c09f37f38b12dc509f676964e392f8fc', chainId: '56', price: 258.103333, referencePrice: 258.103333, referenceChange: 0, open: true, marketStatus: 'Regular session', category: 'Tokenized equity', badge: 'A' },
];

export function marketPrice(symbol: string): number {
  return MARKET_DATA.find((item) => item.symbol === symbol || item.ticker === symbol)?.price ?? MARKET_DATA[0].price;
}

export function money(value: number, currency = 'USD'): string {
  if (currency === 'NGN') {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
