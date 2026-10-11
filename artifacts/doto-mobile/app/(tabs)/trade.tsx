import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppState } from '@/context/AppState';
import { money } from '@/data/market';
import { useMarketData } from '@/context/MarketData';
import { useColors } from '@/hooks/useColors';
import { AssetMark, DemoBadge, MiniChart, Page, Panel, PrimaryButton, SectionHeading, Txt, marketFor } from '@/components/ui';

type TradeSide = 'Buy' | 'Sell';

export default function TradeScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string }>();
  const state = useAppState();
  const { markets, source } = useMarketData();
  const symbol = typeof params.symbol === 'string' ? params.symbol : state.selectedSymbol;
  const market = markets.find((item) => item.symbol === symbol) ?? marketFor(symbol);
  const [side, setSide] = useState<TradeSide>('Buy');
  const [size, setSize] = useState(1);
  const [working, setWorking] = useState(false);

  const submitOrder = () => {
    setWorking(true);
    state.setSelectedSymbol(market.symbol);
    state.openPosition(market.symbol, side, size, market.price);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setWorking(false);
      router.replace('/(tabs)/portfolio');
      Alert.alert('Demo swap completed', `${side} ${size.toFixed(2)} ${market.symbol} was added to simulated positions.`);
    }, 250);
  };

  return (
    <Page>
      <View style={styles.header}>
        <View><Txt size={25} weight="semibold">Swap</Txt><Txt size={13} color={colors.mutedForeground}>Swap demo USD for tokenized stocks</Txt></View>
        <DemoBadge label={source === 'binance' ? 'BINANCE DATA' : 'DEMO'} />
      </View>
      <Pressable
        onPress={() => router.push({ pathname: '/asset/[symbol]', params: { symbol: market.symbol } })}
        style={[styles.assetSelect, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <AssetMark market={market} size={43} />
        <View style={{ flex: 1, gap: 3 }}><Txt size={15} weight="semibold">{market.ticker}</Txt><Txt size={12} color={colors.mutedForeground}>{market.name} · {market.provider} · {market.symbol}</Txt></View>
        <Txt size={14} weight="semibold">{money(market.price)}</Txt>
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>
      <Panel style={styles.chartPanel}>
        <View style={styles.chartHeader}>
          <View><Txt size={12} color={colors.mutedForeground}>Indicative token price</Txt><Txt size={24} weight="semibold">{money(market.price)}</Txt></View>
          <Txt size={12} weight="medium" color={market.referenceChange >= 0 ? colors.primary : colors.destructive}>{market.referenceChange >= 0 ? '+' : ''}{market.referenceChange.toFixed(2)}% vs ref</Txt>
        </View>
        <MiniChart height={112} color={market.referenceChange >= 0 ? colors.primary : colors.destructive} />
        <View style={styles.periods}>{['1H', '4H', '1D', '1W', '1M'].map((period, index) => <Txt key={period} size={11} weight={index === 2 ? 'semibold' : 'regular'} color={index === 2 ? colors.primary : colors.mutedForeground}>{period}</Txt>)}</View>
      </Panel>

      <SectionHeading title="Choose swap direction" />
      <View style={styles.tradeButtons}>
        {(['Sell', 'Buy'] as TradeSide[]).map((item) => {
          const selected = side === item;
          const color = item === 'Buy' ? colors.primary : colors.destructive;
          return (
            <Pressable key={item} onPress={() => setSide(item)} style={[styles.sideButton, { borderColor: selected ? color : colors.border, backgroundColor: selected ? `${color}18` : colors.card }]}>
              <Feather name={item === 'Buy' ? 'trending-up' : 'trending-down'} size={17} color={color} />
              <Txt size={15} weight="semibold" color={color}>{item}</Txt>
            </Pressable>
          );
        })}
      </View>
      <Panel style={{ gap: 15 }}>
        <View style={styles.rowBetween}><Txt size={14} weight="medium">Token amount</Txt><Txt size={13} color={colors.mutedForeground}>{market.symbol}</Txt></View>
        <View style={styles.stepper}>
          <Pressable onPress={() => setSize((value) => Math.max(0.01, Math.round((value - 0.1) * 100) / 100))} style={[styles.stepperButton, { backgroundColor: colors.secondary }]} accessibilityLabel="Decrease token amount"><Feather name="minus" size={19} color={colors.foreground} /></Pressable>
          <Txt size={23} weight="semibold">{size.toFixed(2)}</Txt>
          <Pressable onPress={() => setSize((value) => Math.min(5, Math.round((value + 0.1) * 100) / 100))} style={[styles.stepperButton, { backgroundColor: colors.secondary }]} accessibilityLabel="Increase token amount"><Feather name="plus" size={19} color={colors.foreground} /></Pressable>
        </View>
        <View style={[styles.rowBetween, styles.marginRow, { borderTopColor: colors.border }]}>
          <Txt size={12} color={colors.mutedForeground}>Estimated {side === 'Buy' ? 'cost' : 'value'}</Txt>
          <Txt size={13} weight="semibold">{money(market.price * size)}</Txt>
        </View>
      </Panel>
      <PrimaryButton
        testID="submit-demo-swap"
        title={working ? 'Processing demo swap…' : `Swap ${side.toLowerCase()}`}
        icon={side === 'Buy' ? 'arrow-up-right' : 'arrow-down-right'}
        onPress={submitOrder}
        disabled={working}
      />
      <Txt size={11} color={colors.mutedForeground} style={{ textAlign: 'center' }}>
        Demo only. No tokens are transferred and no order is sent to a provider.
      </Txt>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assetSelect: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 19, borderWidth: 1 },
  chartPanel: { padding: 14, gap: 8 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periods: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 7 },
  tradeButtons: { flexDirection: 'row', gap: 10 },
  sideButton: { flex: 1, height: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  marginRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 13, marginTop: 1 },
});
