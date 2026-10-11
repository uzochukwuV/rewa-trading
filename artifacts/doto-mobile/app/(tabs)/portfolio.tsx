import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PositionStatus } from '@/context/AppState';
import { useMarketData } from '@/context/MarketData';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { money } from '@/data/market';
import { BinancePortfolioPosition, fetchBinancePortfolio } from '@/data/market-api';
import { useColors } from '@/hooks/useColors';
import { AssetMark, DemoBadge, Page, Panel, PrimaryButton, SectionHeading, Txt, marketFor } from '@/components/ui';

const STATUS_TABS: { label: string; value: PositionStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Closed', value: 'closed' },
];

export default function PortfolioScreen() {
  const colors = useColors();
  const router = useRouter();
  const auth = usePrivyAuth();
  const { markets, source } = useMarketData();
  const [tab, setTab] = useState<PositionStatus>('open');
  const [portfolio, setPortfolio] = useState<BinancePortfolioPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletAddress = auth.walletAddress;
    if (!walletAddress || source !== 'binance') {
      setPortfolio([]);
      setLoading(Boolean(walletAddress));
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const positions = await fetchBinancePortfolio(walletAddress);
        if (active) setPortfolio(positions);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load your Binance portfolio.');
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
  }, [auth.walletAddress, source]);

  const positions = useMemo(() => portfolio.flatMap((item) => {
    const market = markets.find((candidate) =>
      candidate.contractAddress.toLowerCase() === item.tokenContractAddress.toLowerCase()
    );
    if (!market) return [];

    const size = Number(item.tokenBalanceAmount);
    const value = Number(item.tokenBalanceUsd);
    const pnl = Number(item.realizedPnlUsd);
    const entryPrice = Number(item.buyAvgPrice);
    if (!Number.isFinite(size) || size < 0 || !Number.isFinite(value) || !Number.isFinite(pnl)) return [];

    return [{
      id: item.tokenContractAddress.toLowerCase(),
      market,
      size,
      value,
      currentPrice: market.price,
      entryPrice: Number.isFinite(entryPrice) ? entryPrice : 0,
      realizedPnl: pnl,
      status: size > 0 ? 'open' as const : 'closed' as const,
      date: Number(item.tokenPositionDuration?.holdingTimestamp || item.lastActiveTimestamp),
    }];
  }), [portfolio, markets]);
  const visiblePositions = useMemo(() => positions.filter((position) => position.status === tab), [positions, tab]);
  const portfolioValue = useMemo(() => positions.reduce(
    (total, position) => total + (position.status === 'open' ? position.value : 0),
    0,
  ), [positions]);
  const countFor = (status: PositionStatus) => status === 'pending'
    ? 0
    : positions.filter((position) => position.status === status).length;

  return (
    <Page>
      <View style={styles.header}>
        <View><Txt size={25} weight="semibold">Portfolio</Txt><Txt size={13} color={colors.mutedForeground}>Your BNB Chain tokenized holdings</Txt></View>
        <DemoBadge label={auth.walletReady && source === 'binance' ? 'BINANCE DATA' : 'PRIVY WALLET'} />
      </View>
      <Panel style={styles.summary}>
        <View style={{ flex: 1, gap: 5 }}>
          <Txt size={12} color={colors.mutedForeground}>Tokenized asset value</Txt>
          <Txt size={27} weight="semibold">{money(portfolioValue)}</Txt>
        </View>
        <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}><Feather name="briefcase" size={20} color={colors.primary} /></View>
      </Panel>
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        {STATUS_TABS.map((item) => (
          <Pressable key={item.value} onPress={() => setTab(item.value)} style={[styles.tab, tab === item.value && { backgroundColor: colors.secondary }]}>
            <Txt size={13} weight={tab === item.value ? 'semibold' : 'regular'} color={tab === item.value ? colors.foreground : colors.mutedForeground}>{item.label}</Txt>
            <View style={[styles.count, { backgroundColor: tab === item.value ? colors.primary : colors.border }]}>
              <Txt size={10} weight="semibold" color={tab === item.value ? colors.primaryForeground : colors.foreground}>
                {countFor(item.value)}
              </Txt>
            </View>
          </Pressable>
        ))}
      </View>
      <SectionHeading title={tab === 'open' ? 'Open holdings' : tab === 'pending' ? 'Pending orders' : 'Trade history'} />
      {loading && !portfolio.length ? (
        <Panel style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
          <Txt size={13} color={colors.mutedForeground}>Loading your Binance portfolio…</Txt>
        </Panel>
      ) : !auth.walletReady ? (
        <Panel style={styles.empty}>
          <Txt size={16} weight="semibold">Preparing your BNB Smart Chain wallet</Txt>
          <Txt size={13} color={colors.mutedForeground} style={styles.centerText}>Your token holdings will appear here when your Privy wallet is ready.</Txt>
        </Panel>
      ) : source !== 'binance' ? (
        <Panel style={styles.empty}>
          <Txt size={16} weight="semibold">Binance market data unavailable</Txt>
          <Txt size={13} color={colors.mutedForeground} style={styles.centerText}>Connect to the Binance data server to load your tokenized asset portfolio.</Txt>
        </Panel>
      ) : error && !portfolio.length ? (
        <Panel style={styles.empty}>
          <Txt size={16} weight="semibold">Could not load portfolio</Txt>
          <Txt size={13} color={colors.mutedForeground} style={styles.centerText}>{error}</Txt>
        </Panel>
      ) : visiblePositions.length ? (
        <View style={{ gap: 11 }}>
          {visiblePositions.map((position) => {
            return (
              <Panel key={position.id} style={styles.positionCard}>
                <View style={styles.positionTop}>
                  <AssetMark market={position.market} size={43} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt size={14} weight="semibold">{position.market.symbol}</Txt>
                    <Txt size={12} color={colors.mutedForeground}>{position.market.name} · {position.size.toLocaleString('en-US', { maximumFractionDigits: 6 })} tokens</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Txt size={14} weight="semibold">{money(position.currentPrice)}</Txt>
                    <Txt size={12} color={position.realizedPnl >= 0 ? colors.primary : colors.destructive}>Realized {position.realizedPnl >= 0 ? '+' : ''}{money(position.realizedPnl)}</Txt>
                  </View>
                </View>
                <View style={[styles.positionMeta, { borderTopColor: colors.border }]}>
                  <Txt size={11} color={colors.mutedForeground}>Avg. buy {position.entryPrice > 0 ? money(position.entryPrice) : '—'} · Value {money(position.value)}</Txt>
                  <Txt size={11} color={colors.mutedForeground}>{position.date > 0 ? new Date(position.date).toLocaleDateString() : '—'}</Txt>
                </View>
              </Panel>
            );
          })}
        </View>
      ) : (
        <Panel style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="bar-chart-2" size={24} color={colors.mutedForeground} /></View>
          <Txt size={16} weight="semibold">{tab === 'open' ? 'No token holdings' : tab === 'pending' ? 'No pending orders' : 'No closed trades yet'}</Txt>
          <Txt size={13} color={colors.mutedForeground} style={styles.centerText}>
            {error
              ? `Portfolio refresh failed: ${error}`
              : tab === 'open'
                ? 'RWA tokens held by your Privy wallet will appear here.'
                : tab === 'pending'
                  ? 'Pending orders are not available from the portfolio endpoint.'
                  : 'Tokens with a zero balance will appear here when Binance returns their trade history.'}
          </Txt>
          <PrimaryButton title="Explore instruments" icon="search" onPress={() => router.push('/discover')} />
        </Panel>
      )}
      <Txt size={11} color={colors.mutedForeground} style={styles.centerText}>Binance Web3 portfolio data · Read-only</Txt>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 47, height: 47, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16 },
  tab: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 13 },
  count: { minWidth: 19, height: 19, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  empty: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 16, gap: 12 },
  emptyIcon: { width: 54, height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center', lineHeight: 20 },
  positionCard: { gap: 14 },
  positionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  positionMeta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11 },
});
