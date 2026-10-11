import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import { PrivyProvider, useEmbeddedEthereumWallet, useLoginWithEmail, useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import type { Chain } from '@privy-io/expo';

const appId = process.env.EXPO_PUBLIC_PRIVY_APP_ID?.trim() ?? '';
const clientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID?.trim() ?? '';
const isConfigured = Boolean(appId && clientId);

const bnbSmartChain = {
  id: 56,
  name: 'BNB Smart Chain',
  network: 'bsc',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed.binance.org'] },
    public: { http: ['https://bsc-dataseed.binance.org'] },
  },
} satisfies Chain;

interface PrivyAuthValue {
  configured: boolean;
  supported: boolean;
  ready: boolean;
  authenticated: boolean;
  userId: string | null;
  walletAddress: string | null;
  walletReady: boolean;
  busy: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  sendEmailCode: (email: string) => Promise<void>;
  loginWithEmailCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  requestWallet: (method: string, params?: unknown[]) => Promise<unknown>;
}

const emptyAuth: PrivyAuthValue = {
  configured: false,
  supported: false,
  ready: true,
  authenticated: false,
  userId: null,
  walletAddress: null,
  walletReady: false,
  busy: false,
  error: null,
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
  sendEmailCode: async () => {},
  loginWithEmailCode: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
  requestWallet: async () => { throw new Error('Sign in and create a wallet before trading.'); },
};

const PrivyAuthContext = createContext<PrivyAuthValue>(emptyAuth);

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const { isReady, user, logout, getAccessToken, error: privyError } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  const oauth = useLoginWithOAuth();
  const email = useLoginWithEmail();
  const walletAddress = wallets[0]?.address ?? null;
  const requestWallet = async (method: string, params: unknown[] = []) => {
    const wallet = wallets[0];
    if (!wallet) throw new Error('Your Privy wallet is not ready yet.');
    const provider = await wallet.getProvider();
    const chainId = await provider.request({ method: 'eth_chainId' });
    if (String(chainId).toLowerCase() !== '0x38') {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
    }
    return provider.request({ method, params } as never);
  };
  const busy = oauth.state.status === 'loading' ||
    email.state.status === 'sending-code' || email.state.status === 'submitting-code';

  const value = useMemo<PrivyAuthValue>(() => ({
    configured: true,
    supported: true,
    ready: isReady,
    authenticated: isReady && Boolean(user),
    userId: isReady ? user?.id ?? null : null,
    walletAddress: isReady ? walletAddress : null,
    walletReady: isReady && Boolean(walletAddress),
    busy,
    error: privyError?.message ?? (email.state.status === 'error' ? email.state.error?.message ?? 'Email sign-in failed.' : null),
    loginWithGoogle: async () => { await oauth.login({ provider: 'google' }); },
    loginWithApple: async () => { await oauth.login({ provider: 'apple' }); },
    sendEmailCode: async (address) => { await email.sendCode({ email: address }); },
    loginWithEmailCode: async (address, code) => { await email.loginWithCode({ email: address, code }); },
    logout,
    getAccessToken,
    requestWallet,
  }), [isReady, user, walletAddress, busy, email.state, oauth, email, logout, getAccessToken, privyError, wallets]);

  return <PrivyAuthContext.Provider value={value}>{children}</PrivyAuthContext.Provider>;
}

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  if (!isConfigured || Platform.OS === 'web') {
    const unavailableAuth: PrivyAuthValue = {
      ...emptyAuth,
      configured: isConfigured,
    };
    return <PrivyAuthContext.Provider value={unavailableAuth}>{children}</PrivyAuthContext.Provider>;
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      supportedChains={[bnbSmartChain]}
      config={{ embedded: { ethereum: { createOnLogin: 'users-without-wallets' } } }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}

export function usePrivyAuth() {
  return useContext(PrivyAuthContext);
}

