import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppState } from '@/context/AppState';
import { useMarketData } from '@/context/MarketData';
import { useColors } from '@/hooks/useColors';
import { DemoBadge, MarketRow, Page, Panel, SectionHeading, Txt } from '@/components/ui';

const FILTERS = ['All', 'Favorites', 'bStock', 'Ondo'] as const;
type Filter = (typeof FILTERS)[number];

export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const state = useAppState();
  const { markets: allMarkets, source } = useMarketData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const markets = useMemo(() => allMarkets.filter((market) => {
    const matchesQuery = `${market.name} ${market.symbol}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Favorites' && state.favorites.includes(market.symbol)) ||
      (filter === 'bStock' && market.provider === 'bStock') ||
      (filter === 'Ondo' && market.provider === 'Ondo');
    return matchesQuery && matchesFilter;
  }), [allMarkets, query, filter, state.favorites]);

  const openMarket = (symbol: string) => {
    state.setSelectedSymbol(symbol);
    router.push({ pathname: '/asset/[symbol]', params: { symbol } });
  };

  return (
    <Page>
      <View style={styles.header}>
        <View><Txt size={25} weight="semibold">Markets</Txt><Txt size={13} color={colors.mutedForeground}>Browse tokenized stocks</Txt></View>
        <DemoBadge label={source === 'binance' ? 'BINANCE DATA' : 'DEMO'} />
      </View>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={19} color={colors.mutedForeground} />
        <TextInput
          testID="market-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search stocks or tickers"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {query ? <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search"><Feather name="x-circle" size={18} color={colors.mutedForeground} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              testID={`filter-${item.toLowerCase()}`}
              onPress={() => setFilter(item)}
              style={[styles.filter, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
            >
              <Txt size={12} weight="medium" color={active ? colors.primaryForeground : colors.foreground}>{item}</Txt>
            </Pressable>
          );
        })}
      </ScrollView>
      <Panel style={styles.marketSummary}>
        <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}20` }]}><Feather name="activity" size={18} color={colors.primary} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={14} weight="semibold">Stock tokens on BNB Chain</Txt>
          <Txt size={12} color={colors.mutedForeground}>Compare indicative prices across providers.</Txt>
        </View>
        <Feather name="arrow-up-right" size={18} color={colors.mutedForeground} />
      </Panel>
      <SectionHeading title={filter === 'Favorites' ? 'Your favorites' : 'Tokenized stocks'} action={`${markets.length} listings`} />
      <Panel style={styles.marketList}>
        {markets.length ? markets.map((market, index) => (
          <React.Fragment key={market.symbol}>
            <MarketRow
              market={market}
              onPress={() => openMarket(market.symbol)}
              favorite={state.favorites.includes(market.symbol)}
              onFavorite={() => state.toggleFavorite(market.symbol)}
            />
            {index !== markets.length - 1 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} /> : null}
          </React.Fragment>
        )) : (
          <View style={styles.empty}>
            <Feather name={filter === 'Favorites' ? 'star' : 'search'} size={26} color={colors.mutedForeground} />
            <Txt size={15} weight="semibold">{filter === 'Favorites' ? 'No saved markets yet' : 'No matches found'}</Txt>
            <Txt size={12} color={colors.mutedForeground} style={{ textAlign: 'center' }}>
              {filter === 'Favorites' ? 'Tap the star beside a stock to save it here.' : 'Try another ticker or provider filter.'}
            </Txt>
          </View>
        )}
      </Panel>
      <Txt size={11} color={colors.mutedForeground}>{source === 'binance' ? 'Binance indicative data · Tokenized stocks carry risk' : 'Indicative sample prices · Tokenized stocks carry risk'}</Txt>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  search: { height: 52, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterRow: { gap: 8, paddingRight: 20 },
  filter: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1 },
  marketSummary: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  summaryIcon: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  marketList: { paddingVertical: 3, paddingHorizontal: 13, gap: 0 },
  empty: { alignItems: 'center', gap: 9, paddingVertical: 32, paddingHorizontal: 18 },
});
