import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppState, PositionStatus } from '@/context/AppState';
import { useMarketData } from '@/context/MarketData';
import { money } from '@/data/market';
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
  const state = useAppState();
  const { markets } = useMarketData();
  const [tab, setTab] = useState<PositionStatus>('open');
  const positions = useMemo(() => state.positions.filter((position) => position.status === tab), [state.positions, tab]);
  return (
    <Page>
      <View style={styles.header}>
        <View><Txt size={25} weight="semibold">Portfolio</Txt><Txt size={13} color={colors.mutedForeground}>Your simulated trading activity</Txt></View>
        <DemoBadge label="PRACTICE" />
      </View>
      <Panel style={styles.summary}>
        <View style={{ flex: 1, gap: 5 }}>
          <Txt size={12} color={colors.mutedForeground}>Demo account balance</Txt>
          <Txt size={27} weight="semibold">{money(state.walletBalance)}</Txt>
        </View>
        <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}><Feather name="briefcase" size={20} color={colors.primary} /></View>
      </Panel>
      <View style={[styles.tabs, { backgroundColor: colors.card }]}>
        {STATUS_TABS.map((item) => (
          <Pressable key={item.value} onPress={() => setTab(item.value)} style={[styles.tab, tab === item.value && { backgroundColor: colors.secondary }]}>
            <Txt size={13} weight={tab === item.value ? 'semibold' : 'regular'} color={tab === item.value ? colors.foreground : colors.mutedForeground}>{item.label}</Txt>
            <View style={[styles.count, { backgroundColor: tab === item.value ? colors.primary : colors.border }]}>
              <Txt size={10} weight="semibold" color={tab === item.value ? colors.primaryForeground : colors.foreground}>
                {state.positions.filter((position) => position.status === item.value).length}
              </Txt>
            </View>
          </Pressable>
        ))}
      </View>
      <SectionHeading title={tab === 'open' ? 'Open trades' : tab === 'pending' ? 'Pending orders' : 'Trade history'} />
      {positions.length ? (
        <View style={{ gap: 11 }}>
          {positions.map((position) => {
            const market = markets.find((item) => item.symbol === position.symbol) ?? marketFor(position.symbol);
            return (
              <Panel key={position.id} style={styles.positionCard}>
                <View style={styles.positionTop}>
                  <AssetMark market={market} size={43} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt size={14} weight="semibold">{position.symbol}</Txt>
                    <Txt size={12} color={colors.mutedForeground}>{position.side} · {position.size.toFixed(2)} tokens</Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Txt size={14} weight="semibold">{money(position.currentPrice)}</Txt>
                    <Txt size={12} color={position.pnl >= 0 ? colors.primary : colors.destructive}>{position.pnl >= 0 ? '+' : ''}{money(position.pnl)}</Txt>
                  </View>
                </View>
                <View style={[styles.positionMeta, { borderTopColor: colors.border }]}>
                  <Txt size={11} color={colors.mutedForeground}>Entry {money(position.entryPrice)}</Txt>
                  <Txt size={11} color={colors.mutedForeground}>{new Date(position.createdAt).toLocaleDateString()}</Txt>
                </View>
                {position.status === 'open' ? (
                  <PrimaryButton
                    title="Close simulated position"
                    variant="outline"
                    onPress={() => Alert.alert('Close demo position?', `Close the ${position.side.toLowerCase()} position on ${position.symbol}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Close position', onPress: () => state.closePosition(position.id, market.price) },
                    ])}
                  />
                ) : null}
              </Panel>
            );
          })}
        </View>
      ) : (
        <Panel style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="bar-chart-2" size={24} color={colors.mutedForeground} /></View>
          <Txt size={16} weight="semibold">{tab === 'open' ? 'No open trades' : tab === 'pending' ? 'No pending orders' : 'No closed trades yet'}</Txt>
          <Txt size={13} color={colors.mutedForeground} style={styles.centerText}>
            {tab === 'open' ? 'Your simulated trades will appear here.' : tab === 'pending' ? 'Pending demo orders will show here.' : 'Closed demo trades will show here.'}
          </Txt>
          <PrimaryButton title="Explore instruments" icon="search" onPress={() => router.push('/discover')} />
        </Panel>
      )}
      <Txt size={11} color={colors.mutedForeground} style={styles.centerText}>Sample data only · No brokerage connection</Txt>
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
