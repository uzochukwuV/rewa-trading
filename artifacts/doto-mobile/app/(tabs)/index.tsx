import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppState } from '@/context/AppState';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { money } from '@/data/market';
import { useWalletStablecoins } from '@/hooks/useWalletStablecoins';
import { useMarketData } from '@/context/MarketData';
import { useColors } from '@/hooks/useColors';
import {
  AssetMark,
  Brand,
  DemoBadge,
  MarketRow,
  MiniChart,
  Page,
  Panel,
  PromoArt,
  SectionHeading,
  Txt,
} from '@/components/ui';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const state = useAppState();
  const auth = usePrivyAuth();
  const { markets, source } = useMarketData();
  const { balanceUsd, loading: balanceLoading, error: balanceError } = useWalletStablecoins();
  const goToMarket = (symbol: string) => {
    state.setSelectedSymbol(symbol);
    router.push({ pathname: '/asset/[symbol]', params: { symbol } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Page>
        <View style={styles.homeHeader}>
          <Brand small />
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={[styles.accountPill, { backgroundColor: colors.card }]} accessibilityRole="button" accessibilityLabel="Open account and wallet settings">
            <View style={[styles.demoChip, { backgroundColor: colors.secondary }]}><Txt size={11} weight="semibold" color={colors.primary}>{auth.walletReady ? 'BNB' : auth.authenticated ? 'WALLET' : 'DEMO'}</Txt></View>
            <Txt size={13} weight="medium">{auth.authenticated ? 'Account' : 'Preview account'}</Txt>
            <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <View style={styles.statusLine}>
          <Txt size={12} color={colors.mutedForeground}>Tokenized stocks • {source === 'binance' ? 'BNB Chain' : 'Demo'}</Txt>
          <DemoBadge label={source === 'binance' ? 'BINANCE DATA' : 'PRACTICE'} />
        </View>
        <View style={styles.balanceBlock}>
          <Txt size={13} color={colors.mutedForeground}>USDC + USDT balance</Txt>
          <Txt size={34} weight="semibold">{balanceLoading && balanceUsd === null ? '…' : balanceUsd === null ? '—' : money(balanceUsd)}</Txt>
          {auth.walletAddress ? (
            <Pressable onPress={() => { void Clipboard.setStringAsync(auth.walletAddress!); }} style={styles.addressRow} accessibilityRole="button" accessibilityLabel="Copy Privy wallet address">
              <Txt size={12} color={colors.mutedForeground}>{`${auth.walletAddress.slice(0, 6)}…${auth.walletAddress.slice(-4)}`}</Txt>
              <Feather name="copy" size={13} color={colors.mutedForeground} />
            </Pressable>
          ) : <Txt size={12} color={colors.mutedForeground}>{auth.authenticated ? 'Preparing your Privy wallet…' : 'Sign in to see your wallet balance'}</Txt>}
          {balanceError ? <Txt size={11} color={colors.destructive}>{balanceError}</Txt> : null}
        </View>

        <Pressable onPress={() => {
          const firstMarket = markets[0];
          if (firstMarket) state.setSelectedSymbol(firstMarket.symbol);
          router.push({ pathname: '/(tabs)/trade', params: { ...(firstMarket ? { symbol: firstMarket.symbol } : {}), side: 'buy' } });
        }} accessibilityRole="button">
          <LinearGradient
            colors={[colors.card, colors.promoPurple, colors.background]}
            start={{ x: 0.05, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.primeCard, { borderColor: colors.promoLilac }]}
          >
            <View style={styles.primeText}>
              <Txt size={21} weight="semibold">Explore tokenized stocks</Txt>
              <Txt size={12} color={colors.mutedForeground} style={{ lineHeight: 19 }}>
                Compare stock tokens and request a spot quote on BNB Chain.
              </Txt>
              <View style={[styles.exploreButton, { backgroundColor: colors.foreground }]}>
                <Txt size={13} weight="semibold" color={colors.background}>Explore stocks</Txt>
              </View>
            </View>
            <PromoArt />
            <View style={[styles.discount, { backgroundColor: colors.destructive }]}><Txt size={11} weight="bold">−50%</Txt></View>
          </LinearGradient>
        </Pressable>
        <View style={styles.carouselDots}>
          <View style={[styles.carouselDot, { backgroundColor: colors.foreground }]} />
          <View style={[styles.carouselDot, { backgroundColor: colors.border }]} />
        </View>

        <SectionHeading title="AI trading ideas" icon="star" action="See all" onAction={() => router.push('/discover')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ideaList}>
          {[
            { market: markets.find((market) => market.ticker === 'NVDA') ?? markets[0], time: 'Market watch', title: 'Nvidia', copy: 'Compare NVDA-linked tokens from bStock and Ondo before placing a demo trade.' },
            { market: markets.find((market) => market.ticker === 'MSFT') ?? markets[1] ?? markets[0], time: 'Market watch', title: 'Microsoft', copy: 'Review the available Microsoft-linked tokens and their indicative prices.' },
          ].map((idea) => (
            <Pressable key={idea.title} onPress={() => goToMarket(idea.market.symbol)} style={[styles.ideaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.ideaMeta}><AssetMark market={idea.market} size={42} /><View><Txt size={11} color={colors.mutedForeground}>{idea.time}</Txt><Txt size={15} weight="semibold">{idea.title}</Txt></View></View>
              <Txt size={13} color={colors.mutedForeground} style={{ lineHeight: 20 }}>{idea.copy}</Txt>
              <View style={styles.ideaFooter}><DemoBadge label="STOCK WATCH" /><Feather name="arrow-up-right" size={18} color={colors.primary} /></View>
            </Pressable>
          ))}
        </ScrollView>

        <SectionHeading title="Popular markets" action="View all" onAction={() => router.push('/discover')} />
        <Panel style={{ paddingHorizontal: 14, paddingVertical: 3, gap: 0 }}>
          {markets.slice(0, 3).map((market, index) => (
            <React.Fragment key={market.symbol}>
              <MarketRow
                market={market}
                onPress={() => goToMarket(market.symbol)}
                favorite={state.favorites.includes(market.symbol)}
                onFavorite={() => state.toggleFavorite(market.symbol)}
                compact
              />
              {index < 2 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} /> : null}
            </React.Fragment>
          ))}
        </Panel>
        <Txt size={11} color={colors.mutedForeground}>{source === 'binance' ? 'Indicative Binance RWA data · Not financial advice' : 'Illustrative sample prices · Not financial advice'}</Txt>
      </Page>
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 24, paddingVertical: 7, paddingHorizontal: 8 },
  demoChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -5 },
  balanceBlock: { alignItems: 'center', gap: 5, paddingVertical: 3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 3 },
  primeCard: { minHeight: 174, borderRadius: 26, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1 },
  primeText: { flex: 1, gap: 8, zIndex: 1 },
  exploreButton: { alignSelf: 'flex-start', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 20, marginTop: 4 },
  discount: { position: 'absolute', right: -9, top: 12, paddingHorizontal: 13, paddingVertical: 6, transform: [{ rotate: '44deg' }] },
  carouselDots: { flexDirection: 'row', alignSelf: 'center', gap: 8, marginTop: -9 },
  carouselDot: { width: 6, height: 6, borderRadius: 5 },
  ideaList: { gap: 12, paddingRight: 20 },
  ideaCard: { width: 286, padding: 16, borderWidth: 1, borderRadius: 22, gap: 13 },
  ideaMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ideaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
