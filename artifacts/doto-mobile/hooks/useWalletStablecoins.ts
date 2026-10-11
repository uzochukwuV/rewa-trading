import { useEffect, useState } from 'react';
import { usePrivyAuth } from '@/context/PrivyAuth';

const STABLECOINS = [
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // Binance-Peg USDC on BNB Chain
  '0x55d398326f99059fF775485246999027B3197955', // Binance-Peg USDT on BNB Chain
] as const;

function balanceOfCallData(walletAddress: string) {
  return `0x70a08231${walletAddress.slice(2).toLowerCase().padStart(64, '0')}`;
}

export function useWalletStablecoins() {
  const auth = usePrivyAuth();
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletAddress = auth.walletAddress;
    if (!auth.authenticated || !walletAddress) {
      setBalanceUsd(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rawBalances = await Promise.all(STABLECOINS.map((address) =>
          auth.requestWallet('eth_call', [{ to: address, data: balanceOfCallData(walletAddress) }, 'latest'])
        ));
        const total = rawBalances.reduce((sum, result) => {
          if (typeof result !== 'string' || !/^0x[0-9a-f]+$/i.test(result)) {
            throw new Error('The BNB Chain returned an invalid stablecoin balance.');
          }
          const raw = BigInt(result);
          return sum + Number(raw) / 1e18;
        }, 0);
        if (active) setBalanceUsd(total);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load stablecoin balances.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const interval = setInterval(() => { void load(); }, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [auth.authenticated, auth.walletAddress, auth.requestWallet]);

  return { balanceUsd, loading, error };
}
