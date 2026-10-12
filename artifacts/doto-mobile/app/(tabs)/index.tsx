import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
import { Market } from '@/data/market';
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
  const [walletAction, setWalletAction] = React.useState<'transfer' | 'receive' | null>(null);
  const [transferAsset, setTransferAsset] = React.useState<Market | null>(null);
  const [transferAddress, setTransferAddress] = React.useState('');
  const [transferAmount, setTransferAmount] = React.useState('');
  const [transferBusy, setTransferBusy] = React.useState(false);
  const [transferMessage, setTransferMessage] = React.useState('');
  const goToMarket = (symbol: string) => {
    state.setSelectedSymbol(symbol);
    router.push({ pathname: '/asset/[symbol]', params: { symbol } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Page>
        <View style={styles.homeHeader}>
          <Brand small />
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/(tabs)/profile')} style={[styles.accountPill, { backgroundColor: colors.card }]} accessibilityRole="button" accessibilityLabel="Open account and wallet settings">
              <View style={[styles.demoChip, { backgroundColor: colors.secondary }]}><Txt size={11} weight="semibold" color={colors.primary}>{auth.walletReady ? 'BNB' : auth.authenticated ? 'WALLET' : 'DEMO'}</Txt></View>
              <Txt size={13} weight="medium">{auth.authenticated ? 'Account' : 'Preview account'}</Txt>
              <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
            </Pressable>
            <Pressable onPress={() => router.push('/ai')} style={[styles.aiButton, { backgroundColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Chat with Doto AI">
              <Feather name="message-circle" size={19} color={colors.primaryForeground} />
            </Pressable>
          </View>
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

        <View style={styles.walletActions}>
          <Pressable onPress={() => { setTransferMessage(''); setWalletAction('transfer'); }} style={[styles.walletAction, { backgroundColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Transfer assets">
            <Feather name="arrow-up-right" size={19} color={colors.primaryForeground} /><Txt size={13} weight="semibold" color={colors.primaryForeground}>Transfer</Txt>
          </Pressable>
          <Pressable onPress={() => { setTransferMessage(''); setWalletAction('receive'); }} style={[styles.walletAction, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Receive assets">
            <Feather name="arrow-down-left" size={19} color={colors.primary} /><Txt size={13} weight="semibold">Receive</Txt>
          </Pressable>
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
      <Modal transparent visible={walletAction !== null} animationType="slide" onRequestClose={() => !transferBusy && setWalletAction(null)}>
        <View style={styles.modalRoot}><Pressable style={styles.scrim} onPress={() => !transferBusy && setWalletAction(null)} />
          <View style={[styles.walletSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.mutedForeground }]} />
            <View style={styles.sheetHeader}><Txt size={20} weight="semibold">{walletAction === 'receive' ? 'Receive assets' : 'Transfer assets'}</Txt><Pressable onPress={() => setWalletAction(null)} disabled={transferBusy}><Feather name="x" size={21} color={colors.mutedForeground} /></Pressable></View>
            {!auth.walletReady || !auth.walletAddress ? <Txt size={13} color={colors.mutedForeground}>Sign in and wait for your BNB Chain wallet to be ready.</Txt> : walletAction === 'receive' ? <>
              <Txt size={13} color={colors.mutedForeground}>Send compatible BNB Smart Chain assets to this address.</Txt>
              <Pressable onPress={() => void Clipboard.setStringAsync(auth.walletAddress!)} style={[styles.addressBox, { backgroundColor: colors.background }]}><Txt size={12} weight="medium" selectable>{auth.walletAddress}</Txt><Feather name="copy" size={18} color={colors.primary} /></Pressable>
              <Txt size={11} color={colors.mutedForeground}>Only send assets on BNB Smart Chain to this wallet.</Txt>
            </> : <>
              <Txt size={12} color={colors.mutedForeground}>Send an on-chain token from your wallet. RWA contracts may restrict transfers; confirm the token supports your recipient before signing.</Txt>
              <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>{markets.map((asset) => <Pressable key={asset.symbol} onPress={() => setTransferAsset(asset)} style={[styles.assetOption, { borderColor: colors.border }]}><AssetMark market={asset} size={30} /><View style={{ flex: 1 }}><Txt size={13} weight="semibold">{asset.symbol}</Txt><Txt size={10} color={colors.mutedForeground}>{asset.provider} · BNB Chain</Txt></View><Feather name={transferAsset?.symbol === asset.symbol ? 'check-circle' : 'circle'} size={18} color={transferAsset?.symbol === asset.symbol ? colors.primary : colors.border} /></Pressable>)}</ScrollView>
              <TextInput value={transferAddress} onChangeText={setTransferAddress} placeholder="Recipient 0x address" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[styles.walletInput, { color: colors.foreground, borderColor: colors.border }]} />
              <TextInput value={transferAmount} onChangeText={setTransferAmount} placeholder="Amount" placeholderTextColor={colors.mutedForeground} keyboardType="decimal-pad" style={[styles.walletInput, { color: colors.foreground, borderColor: colors.border }]} />
              <Pressable disabled={transferBusy || !transferAsset || !auth.walletReady || !/^0x[a-fA-F0-9]{40}$/.test(transferAddress) || !/^\d+(\.\d+)?$/.test(transferAmount) || Number(transferAmount) <= 0} onPress={async () => {
                if (!transferAsset?.contractAddress) { setTransferMessage('This market does not have a token contract address.'); return; }
                setTransferBusy(true); setTransferMessage('');
                try {
                  const decimals = transferAsset.decimals || 18;
                  const [whole, fraction = ''] = transferAmount.split('.');
                  if (fraction.length > decimals) throw new Error(`Amount supports up to ${decimals} decimal places.`);
                  const amount = BigInt(whole) * (10n ** BigInt(decimals)) + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0');
                  const to = transferAddress.slice(2).toLowerCase().padStart(64, '0');
                  const value = amount.toString(16).padStart(64, '0');
                  const txHash = await auth.requestWallet('eth_sendTransaction', [{ from: auth.walletAddress, to: transferAsset.contractAddress, value: '0x0', data: `0xa9059cbb${to}${value}` }]);
                  setTransferMessage(`Transfer submitted: ${String(txHash)}`);
                } catch (error) { setTransferMessage(error instanceof Error ? error.message : 'Transfer could not be submitted.'); }
                finally { setTransferBusy(false); }
              }} style={[styles.submitTransfer, { backgroundColor: colors.primary, opacity: transferBusy ? 0.6 : 1 }]}><Txt size={14} weight="semibold" color={colors.primaryForeground}>{transferBusy ? 'Confirm in wallet…' : `Transfer ${transferAsset?.symbol ?? ''}`}</Txt></Pressable>
              {transferMessage ? <Txt size={11} color={transferMessage.startsWith('Transfer submitted') ? colors.primary : colors.destructive}>{transferMessage}</Txt> : null}
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 24, paddingVertical: 7, paddingHorizontal: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiButton: { width: 39, height: 39, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  demoChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -5 },
  balanceBlock: { alignItems: 'center', gap: 5, paddingVertical: 3 },
  walletActions: { flexDirection: 'row', gap: 10, marginTop: -6 },
  walletAction: { flex: 1, height: 46, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: '#0009' },
  walletSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, gap: 14, maxHeight: '88%' },
  handle: { width: 38, height: 4, borderRadius: 3, alignSelf: 'center', opacity: 0.6 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderRadius: 14, padding: 14 },
  assetOption: { minHeight: 50, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 },
  walletInput: { height: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14 },
  submitTransfer: { height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
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
