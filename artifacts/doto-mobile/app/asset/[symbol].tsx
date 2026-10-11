import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppState } from '@/context/AppState';
import { useMarketData } from '@/context/MarketData';
import { money } from '@/data/market';
import { useColors } from '@/hooks/useColors';
import { AssetMark, DemoBadge, MiniChart, Page, Panel, PrimaryButton, SectionHeading, Txt, marketFor } from '@/components/ui';

type DetailTab = 'Details' | 'Analysis' | 'News' | 'Calendar';

export default function AssetDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const state = useAppState();
  const { markets, source } = useMarketData();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const symbol = typeof params.symbol === 'string' ? params.symbol : state.selectedSymbol;
  const market = markets.find((item) => item.symbol === symbol) ?? marketFor(symbol);
  const [tab, setTab] = useState<DetailTab>('Details');
  const [period, setPeriod] = useState('1D');
  const favorite = state.favorites.includes(market.symbol);

  const startTrade = () => {
    state.setSelectedSymbol(market.symbol);
    router.push({ pathname: '/(tabs)/trade', params: { symbol: market.symbol } });
  };

  return (
    <Page>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.assetHeading}>
          <AssetMark market={market} size={36} />
          <View><Txt size={15} weight="semibold">{market.name}</Txt><Txt size={11} color={colors.mutedForeground}>{market.ticker} · {market.provider} · {market.symbol}</Txt></View>
        </View>
        <Pressable onPress={() => state.toggleFavorite(market.symbol)} style={styles.iconButton} accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Feather name="star" size={19} color={favorite ? colors.primary : colors.mutedForeground} />
        </Pressable>
      </View>
      <View style={styles.priceBlock}>
        <View>
          <Txt size={29} weight="semibold">{money(market.price)}</Txt>
          <Txt size={12} color={colors.mutedForeground}>{source === 'binance' ? 'Indicative Binance price' : 'Indicative sample price'}</Txt>
        </View>
        <View style={[styles.changePill, { backgroundColor: market.referenceChange >= 0 ? `${colors.primary}20` : `${colors.destructive}20` }]}>
          <Feather name={market.referenceChange >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={15} color={market.referenceChange >= 0 ? colors.primary : colors.destructive} />
          <Txt size={12} weight="semibold" color={market.referenceChange >= 0 ? colors.primary : colors.destructive}>{market.referenceChange >= 0 ? '+' : ''}{market.referenceChange.toFixed(2)}% vs ref</Txt>
        </View>
      </View>

      <Panel style={styles.chartCard}>
        <View style={styles.chartLabels}><Txt size={12} color={colors.mutedForeground}>Price movement</Txt><DemoBadge label="MOCK CHART" /></View>
        <MiniChart height={171} color={market.referenceChange >= 0 ? colors.primary : colors.destructive} />
        <View style={styles.periodRow}>{['1H', '4H', '1D', '1W', '1M'].map((item) => (
          <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.period, period === item && { backgroundColor: colors.secondary }]}>
            <Txt size={11} weight={period === item ? 'semibold' : 'regular'} color={period === item ? colors.foreground : colors.mutedForeground}>{item}</Txt>
          </Pressable>
        ))}</View>
      </Panel>

      <View style={[styles.detailTabs, { borderBottomColor: colors.border }]}>
        {(['Details', 'Analysis', 'News', 'Calendar'] as DetailTab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={styles.detailTab}>
            <Txt size={12} weight={tab === item ? 'semibold' : 'regular'} color={tab === item ? colors.foreground : colors.mutedForeground}>{item}</Txt>
            {tab === item ? <View style={[styles.activeUnderline, { backgroundColor: colors.primary }]} /> : null}
          </Pressable>
        ))}
      </View>

      {tab === 'Details' ? (
        <>
          <SectionHeading title="Market statistics" />
          <Panel style={styles.statsPanel}>
            {[
              ['Day high', money(market.price * 1.018)],
              ['Day low', money(market.price * 0.983)],
              ['Price vs reference', `${market.referenceChange >= 0 ? '+' : ''}${market.referenceChange.toFixed(2)}%`],
              ['Market', market.category],
              ['Spread', 'Variable · sample'],
              ['Market status', market.marketStatus],
            ].map(([label, value], index) => (
              <View key={label} style={[styles.statRow, index > 0 && { borderTopColor: colors.border }]}>
                <Txt size={12} color={colors.mutedForeground}>{label}</Txt>
                <Txt size={12} weight="medium">{value}</Txt>
              </View>
            ))}
          </Panel>
          <Panel style={styles.leveragePanel}>
            <View style={[styles.leverageIcon, { backgroundColor: colors.secondary }]}><Feather name="shield" size={17} color={colors.primary} /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt size={13} weight="semibold">Risk reminder</Txt>
              <Txt size={11} color={colors.mutedForeground}>Leverage magnifies simulated gains and losses. Values are examples only.</Txt>
            </View>
          </Panel>
        </>
      ) : tab === 'Analysis' ? (
        <>
          <SectionHeading title="Technical analysis" action="Simulated" />
          <Panel style={{ gap: 16 }}>
            <View style={styles.signalHeader}>
              <View style={[styles.signalIcon, { backgroundColor: `${colors.primary}20` }]}><Feather name="trending-up" size={19} color={colors.primary} /></View>
              <View style={{ flex: 1, gap: 3 }}><Txt size={14} weight="semibold">Buy signal</Txt><Txt size={11} color={colors.mutedForeground}>Illustrative trend reading</Txt></View>
              <Txt size={14} weight="semibold" color={colors.primary}>Strong</Txt>
            </View>
            {[
              { label: 'Moving averages', value: 74, color: colors.primary },
              { label: 'Momentum', value: 57, color: colors.gold },
              { label: 'Volatility', value: 36, color: colors.destructive },
            ].map((item) => (
              <View key={item.label} style={{ gap: 8 }}>
                <View style={styles.rowBetween}><Txt size={12} color={colors.mutedForeground}>{item.label}</Txt><Txt size={12} weight="medium">{item.value}/100</Txt></View>
                <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><View style={[styles.progressFill, { backgroundColor: item.color, width: `${item.value}%` }]} /></View>
              </View>
            ))}
          </Panel>
          <Panel style={{ gap: 8 }}>
            <Txt size={13} weight="semibold">What this means</Txt>
            <Txt size={12} color={colors.mutedForeground} style={{ lineHeight: 19 }}>These values are generated sample content for the interface preview. They do not use live market feeds and are not a recommendation.</Txt>
          </Panel>
        </>
      ) : tab === 'News' ? (
        <>
          <SectionHeading title="Market news" action="Sample feed" />
          {[
            { time: '12 min ago', headline: `${market.name} steadies as traders watch key levels`, source: 'Doto market brief' },
            { time: '1 hour ago', headline: 'Global markets move into a data-heavy trading session', source: 'Market watch' },
            { time: '3 hours ago', headline: 'Investors balance fresh optimism with ongoing uncertainty', source: 'Daily markets' },
          ].map((item) => (
            <Panel key={item.headline} style={styles.newsCard}>
              <View style={styles.newsTop}><Txt size={11} color={colors.mutedForeground}>{item.time}</Txt><DemoBadge label="SAMPLE" /></View>
              <Txt size={14} weight="semibold" style={{ lineHeight: 21 }}>{item.headline}</Txt>
              <Txt size={11} color={colors.mutedForeground}>{item.source}</Txt>
            </Panel>
          ))}
        </>
      ) : (
        <>
          <SectionHeading title="Economic calendar" action="Sample events" />
          {[
            { date: 'Today · 14:00', country: 'United States', event: 'Consumer confidence preview', impact: 'Medium' },
            { date: 'Tomorrow · 09:30', country: 'Euro area', event: 'Industrial production preview', impact: 'Low' },
            { date: 'Fri · 12:30', country: 'United States', event: 'Employment report preview', impact: 'High' },
          ].map((item) => (
            <Panel key={item.event} style={styles.eventCard}>
              <View style={[styles.eventMark, { backgroundColor: colors.secondary }]}><Feather name="calendar" size={17} color={colors.primary} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt size={11} color={colors.mutedForeground}>{item.date} · {item.country}</Txt>
                <Txt size={13} weight="semibold">{item.event}</Txt>
              </View>
              <Txt size={10} weight="medium" color={colors.mutedForeground}>{item.impact}</Txt>
            </Panel>
          ))}
          <Txt size={11} color={colors.mutedForeground}>All events and timings are placeholders.</Txt>
        </>
      )}
      <PrimaryButton title={`Trade ${market.symbol}`} icon="trending-up" onPress={startTrade} />
      <Txt size={11} color={colors.mutedForeground} style={{ textAlign: 'center' }}>Mock prices and analysis · No live trading</Txt>
    </Page>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  assetHeading: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  priceBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: -5 },
  changePill: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartCard: { padding: 14, gap: 10 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  period: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  detailTabs: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, marginTop: -3 },
  detailTab: { paddingVertical: 11, minWidth: 58, alignItems: 'center', gap: 8 },
  activeUnderline: { height: 2, width: '100%', borderRadius: 2 },
  statsPanel: { gap: 0, paddingVertical: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 41, borderTopWidth: StyleSheet.hairlineWidth },
  leveragePanel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leverageIcon: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  signalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newsCard: { gap: 9 },
  newsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  eventMark: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
