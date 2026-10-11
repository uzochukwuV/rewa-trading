import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppState } from '@/context/AppState';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { money } from '@/data/market';
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
  PrimaryButton,
  PromoArt,
  SectionHeading,
  Txt,
} from '@/components/ui';

type WalletAction = 'add' | 'withdraw' | 'details' | null;

function WalletSheet({
  action,
  balance,
  onClose,
  onAdd,
  onWithdraw,
}: {
  action: WalletAction;
  balance: number;
  onClose: () => void;
  onAdd: (amount: number) => void;
  onWithdraw: (amount: number) => boolean;
}) {
  const colors = useColors();
  const [amount, setAmount] = useState('250');
  if (!action) return null;
  const title = action === 'add' ? 'Add money' : action === 'withdraw' ? 'Withdraw' : 'Account details';
  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sheet" />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.mutedForeground }]} />
        <View style={styles.sheetHeader}>
          <Txt size={20} weight="semibold">{title}</Txt>
          <Pressable onPress={onClose} accessibilityLabel="Close"><Feather name="x" size={21} color={colors.mutedForeground} /></Pressable>
        </View>
        {action === 'details' ? (
          <View style={{ gap: 13 }}>
            <View style={styles.detailRow}><Txt size={13} color={colors.mutedForeground}>Account</Txt><Txt size={13} weight="medium">Demo • Tokenized stocks</Txt></View>
            <View style={styles.detailRow}><Txt size={13} color={colors.mutedForeground}>Buying power</Txt><Txt size={13} weight="medium">{money(balance)}</Txt></View>
            <View style={styles.detailRow}><Txt size={13} color={colors.mutedForeground}>Open positions</Txt><Txt size={13} weight="medium">0</Txt></View>
            <Txt size={12} color={colors.mutedForeground}>All account values and activity are local sample data.</Txt>
          </View>
        ) : (
          <>
            <Txt size={13} color={colors.mutedForeground}>Demo buying power: {money(balance)}</Txt>
            <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Txt size={17} weight="semibold">$</Txt>
              <View style={{ flex: 1 }}>
                <Txt size={11} color={colors.mutedForeground}>Amount in USD</Txt>
                <View style={styles.amountLine}>
                  <Txt size={20} weight="semibold">{amount || '0'}</Txt>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[100, 250, 500].map((value) => (
                      <Pressable key={value} onPress={() => setAmount(String(value))} style={[styles.amountChip, { backgroundColor: colors.secondary }]}>
                        <Txt size={11} weight="medium">${value}</Txt>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
            <Txt size={11} color={colors.mutedForeground}>No money moves. This only changes the local demo balance.</Txt>
            <PrimaryButton
              title={action === 'add' ? 'Add demo funds' : 'Withdraw demo funds'}
              onPress={() => {
                const value = Number(amount);
                if (!Number.isFinite(value) || value <= 0) {
                  Alert.alert('Enter an amount', 'Use a number greater than zero.');
                  return;
                }
                if (action === 'add') onAdd(value);
                else if (!onWithdraw(value)) {
                  Alert.alert('Not enough demo funds', 'Choose an amount no greater than the demo wallet balance.');
                  return;
                }
                onClose();
              }}
            />
          </>
        )}
        {action === 'details' ? <PrimaryButton title="Done" onPress={onClose} /> : null}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const state = useAppState();
  const auth = usePrivyAuth();
  const { markets, source } = useMarketData();
  const [action, setAction] = useState<WalletAction>(null);
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
          <Txt size={13} color={colors.mutedForeground}>Account balance</Txt>
          <Txt size={34} weight="semibold">{money(state.walletBalance)}</Txt>
          <Txt size={12} color={colors.mutedForeground}>Available buying power for simulated stock trades</Txt>
        </View>

        <View style={styles.quickActions}>
          {[
            { icon: 'upload' as const, title: 'Add money', action: 'add' as const, active: true },
            { icon: 'download' as const, title: 'Withdraw', action: 'withdraw' as const, active: false },
            { icon: 'more-vertical' as const, title: 'Details', action: 'details' as const, active: false },
          ].map((item) => (
            <Pressable key={item.title} onPress={() => setAction(item.action)} style={styles.quickAction} accessibilityRole="button">
              <View style={[styles.actionCircle, { backgroundColor: item.active ? colors.foreground : colors.secondary }]}>
                <Feather name={item.icon} size={21} color={item.active ? colors.background : colors.foreground} />
              </View>
              <Txt size={13} color={item.active ? colors.foreground : colors.mutedForeground}>{item.title}</Txt>
            </Pressable>
          ))}
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
      <WalletSheet
        action={action}
        balance={state.walletBalance}
        onClose={() => setAction(null)}
        onAdd={state.addFunds}
        onWithdraw={state.withdrawFunds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 24, paddingVertical: 7, paddingHorizontal: 8 },
  demoChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -5 },
  balanceBlock: { alignItems: 'center', gap: 5, paddingVertical: 3 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -2, marginBottom: 1 },
  quickAction: { alignItems: 'center', gap: 8, minWidth: 82 },
  actionCircle: { width: 58, height: 58, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
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
  sheetOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end', zIndex: 10 },
  sheet: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, gap: 17 },
  sheetHandle: { width: 42, height: 4, borderRadius: 3, alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountInput: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  amountLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  amountChip: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 11 },
});
