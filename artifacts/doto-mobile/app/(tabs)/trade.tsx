import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useAppState } from '@/context/AppState';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { Market, money } from '@/data/market';
import { useMarketData } from '@/context/MarketData';
import { useColors } from '@/hooks/useColors';
import { AssetMark, DemoBadge, Page, Panel, PrimaryButton, Txt } from '@/components/ui';
import { BinanceQuote, TradeToken, broadcastTransaction, buildSwap, fetchQuote, fromBaseUnits, getApproval, getRfqStatus, getTransactionStatus, simulateTransaction, submitRfq, toBaseUnits } from '@/data/trading-api';

const STABLES: TradeToken[] = [
  { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
];
type Side = 'buy' | 'sell';
type Sheet = 'asset' | 'pay' | 'review' | null;
type Result = { status: 'success' | 'pending' | 'failed'; title: string; detail: string; hash?: string };

function Row({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.row}><Txt size={13} color={colors.mutedForeground}>{label}</Txt><Txt size={13} weight="medium" numberOfLines={1}>{value}</Txt></View>;
}

export default function TradeScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ symbol?: string; side?: string }>();
  const state = useAppState();
  const auth = usePrivyAuth();
  const { markets, source } = useMarketData();
  const [symbol, setSymbol] = useState(typeof params.symbol === 'string' ? params.symbol : state.selectedSymbol);
  const [side, setSide] = useState<Side>(params.side === 'sell' ? 'sell' : 'buy');
  const [stable, setStable] = useState(STABLES[0]);
  const [amount, setAmount] = useState('25');
  const [quote, setQuote] = useState<BinanceQuote | null>(null);
  const [quoteTime, setQuoteTime] = useState(0);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [now, setNow] = useState(Date.now());

  const market = useMemo(() => markets.find((item) => item.symbol === symbol) ?? markets[0], [markets, symbol]);
  const token = market ? { address: market.contractAddress, symbol: market.symbol, decimals: market.decimals || 18 } : null;
  const from = side === 'buy' ? stable : token;
  const to = side === 'buy' ? token : stable;
  const baseReady = source === 'binance' && Boolean(auth.authenticated && auth.walletReady && token?.address);
  const amountUnits = useMemo(() => {
    try { return from && amount ? toBaseUnits(amount, from.decimals) : ''; } catch { return ''; }
  }, [amount, from?.decimals]);

  useEffect(() => {
    if (typeof params.symbol === 'string') setSymbol(params.symbol);
    if (params.side === 'buy' || params.side === 'sell') setSide(params.side);
  }, [params.symbol, params.side]);

  useEffect(() => {
    let cancelled = false;
    setQuote(null);
    setQuoteError(null);
    if (!baseReady || !from || !to || !amountUnits) return;
    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const bearer = await auth.getAccessToken();
        if (!bearer) throw new Error('Your sign-in session expired. Sign in again to request a quote.');
        const routes = await fetchQuote({ token: bearer, walletAddress: auth.walletAddress!, amount: amountUnits, from, to });
        if (!routes.length || !routes[0].quoteId) throw new Error('No spot route is available for this pair and amount.');
        if (!cancelled) { setQuote(routes[0]); setQuoteTime(Date.now()); }
      } catch (error) {
        if (!cancelled) setQuoteError(error instanceof Error ? error.message : 'Could not load a quote.');
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [baseReady, amountUnits, from?.address, to?.address, auth.walletAddress, auth.authenticated]);

  useEffect(() => {
    if (!quote) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quoteTime, Boolean(quote)]);

  const resetQuote = () => { setQuote(null); setQuoteError(null); };
  const receiveLabel = side === 'buy' ? 'Buy' : 'Receive';
  const inputTokenLabel = side === 'buy' ? 'Pay with' : 'Sell';
  const outputTokenLabel = side === 'buy' ? 'Buy' : 'Receive';
  const estimatedOutput = quote && to ? fromBaseUnits(quote.toTokenAmount, Number(quote.toToken?.decimal ?? to.decimals)) : null;
  const quoteFresh = Boolean(quote && now - quoteTime < 30_000);

  const requestTradeToken = async () => {
    const bearer = await auth.getAccessToken();
    if (!bearer || !from || !to || !quote) throw new Error('The quote or your sign-in session has expired. Refresh the quote and try again.');
    return { bearer, amount: amountUnits };
  };

  const waitForReceipt = async (hash: string) => {
    for (let i = 0; i < 30; i += 1) {
      const receipt = await auth.requestWallet('eth_getTransactionReceipt', [hash]) as { status?: string } | null;
      if (receipt?.status) return receipt.status === '0x1';
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return null;
  };

  const signAndBroadcast = async (bearer: string, transaction: Record<string, unknown>) => {
    let signed: unknown;
    try {
      signed = await auth.requestWallet('eth_signTransaction', [transaction]);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const rejected = /reject|cancel/i.test(message) || (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 4001);
      const unsupported = /unsupported|not supported|method not found|not implemented/i.test(message) || (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === -32601);
      if (rejected || !unsupported) throw error;
    }
    if (typeof signed === 'string' && /^0x[0-9a-f]+$/i.test(signed)) {
      setStep('Sending through Binance MEV-protected relay…');
      const broadcast = await broadcastTransaction(bearer, auth.walletAddress!, signed);
      return broadcast.txHash;
    }
    setStep('Confirm the transaction in your wallet…');
    return String(await auth.requestWallet('eth_sendTransaction', [transaction]));
  };

  const execute = async () => {
    if (!quote || !market || !from || !to || !auth.walletAddress) return;
    setBusy(true);
    setSheet(null);
    try {
      const { bearer, amount: baseAmount } = await requestTradeToken();
      setStep('Refreshing the route…');
      let built = await buildSwap({ token: bearer, walletAddress: auth.walletAddress, amount: baseAmount, from, to, quoteId: quote.quoteId, slippagePercent: '0.5' });
      const routerResult = (built.routerResult || built) as Record<string, any>;
      const mode = String(built.executionMode || routerResult.executionMode || quote.executionMode || 'SWAP').toUpperCase();

      const spender = String(built.approveTarget || routerResult.approveTarget || quote.approveTarget || '');
      if (/^0x[a-fA-F0-9]{40}$/.test(spender) && from.address !== '0x0000000000000000000000000000000000000000') {
        const allowanceCall = `0xdd62ed3e${auth.walletAddress.slice(2).toLowerCase().padStart(64, '0')}${spender.slice(2).toLowerCase().padStart(64, '0')}`;
        const allowanceHex = String(await auth.requestWallet('eth_call', [{ to: from.address, data: allowanceCall }, 'latest']));
        const allowance = BigInt(allowanceHex || '0x0');
        if (allowance < BigInt(baseAmount)) {
          setStep('Preparing token approval…');
          const approvalData = await getApproval(bearer, from.address, baseAmount, quote.vendorName);
          const approval = Array.isArray(approvalData.data) ? approvalData.data[0] : approvalData;
          const approvalTx = { from: auth.walletAddress, to: approval.dexContractAddress || spender, value: '0x0', data: approval.data, gas: approval.gasLimit ? `0x${BigInt(approval.gasLimit).toString(16)}` : undefined };
          const simulation = await simulateTransaction(bearer, approvalTx);
          if (String(simulation.status).toUpperCase() !== 'SUCCESS') throw new Error(simulation.failReason || 'Token approval simulation failed.');
          setStep('Approve the spending limit in your wallet…');
          const approvalHash = await signAndBroadcast(bearer, approvalTx);
          const approved = await waitForReceipt(approvalHash);
          if (approved === false) throw new Error('Token approval failed on BNB Chain. No swap was sent.');
          if (approved === null) {
            setResult({ status: 'pending', title: 'Approval is pending', detail: 'Wait for the token approval to confirm on BNB Chain. No swap has been submitted. Refresh the quote after it confirms.' });
            return;
          }
          setResult({ status: 'success', title: 'Approval confirmed', detail: `Your ${from.symbol} allowance is set for the quoted route. Refresh the quote, then review and confirm the swap separately.` });
          return;
        }
      }

      if (mode === 'RFQ') {
        const rfq = (built.rfq || routerResult.rfq || {}) as Record<string, any>;
        let typedData = rfq.typedDataToSign;
        if (typeof typedData === 'string' && typedData.startsWith('{')) {
          try { typedData = JSON.parse(typedData); } catch { /* The validation below provides the user-facing error. */ }
        }
        const vendor = String(rfq.vendor || quote.vendorName || '');
        const rfqQuoteId = String(rfq.orderId || '');
        if (!typedData || typeof typedData !== 'object' || !vendor || !rfqQuoteId) throw new Error('Binance did not return a complete signed stock-order payload. Refresh the quote and try again.');
        setStep('Waiting for your wallet signature…');
        const signature = await auth.requestWallet('eth_signTypedData_v4', [auth.walletAddress, JSON.stringify(typedData)]);
        setStep('Submitting the stock order…');
        const submitted = await submitRfq(bearer, { requestId: makeRequestId(), userSignature: String(signature), vendor, quoteId: rfqQuoteId, signingScheme: rfq.signingScheme ? String(rfq.signingScheme) : undefined });
        const orderId = String(submitted.orderId || submitted.id || '');
        if (!orderId) throw new Error('The order was signed, but Binance did not return an order reference. Check order activity before retrying.');
        setStep('Waiting for the issuer route to settle…');
        let status: Record<string, any> = {};
        for (let i = 0; i < 12; i += 1) {
          status = await getRfqStatus(bearer, orderId);
          const stateValue = String(status.status || status.orderStatus || '').toUpperCase();
          if (['FILLED', 'SUCCESS', 'COMPLETED'].includes(stateValue)) break;
          if (['FAILED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(stateValue)) throw new Error(status.errorMsg || `The stock order ${stateValue.toLowerCase()}.`);
          await new Promise((resolve) => setTimeout(resolve, 4000));
        }
        const finalStatus = String(status.status || status.orderStatus || '').toUpperCase();
        setResult({ status: ['FILLED', 'SUCCESS', 'COMPLETED'].includes(finalStatus) ? 'success' : 'pending', title: ['FILLED', 'SUCCESS', 'COMPLETED'].includes(finalStatus) ? 'Trade complete' : 'Order submitted', detail: ['FILLED', 'SUCCESS', 'COMPLETED'].includes(finalStatus) ? `${side === 'buy' ? 'Bought' : 'Sold'} ${market.symbol} through ${vendor}.` : `Your ${vendor} order is still processing. Reference ${orderId}.` });
        return;
      }

      const tx = built.tx || routerResult.tx;
      if (!tx || !tx.to || !tx.data) throw new Error('Binance did not return transaction data for this route.');
      const transaction = { from: auth.walletAddress, to: tx.to, value: String(tx.value || '0'), data: tx.data, ...(tx.gas ? { gas: String(tx.gas) } : tx.gasLimit ? { gas: String(tx.gasLimit) } : {}) };

      setStep('Simulating on BNB Chain…');
      const simulation = await simulateTransaction(bearer, transaction);
      if (String(simulation.status).toUpperCase() !== 'SUCCESS') throw new Error(simulation.failReason || 'Transaction simulation failed. Check your balance and try a smaller amount.');
      setStep('Sign the swap in your wallet…');
      const hash = await signAndBroadcast(bearer, transaction);
      setStep('Waiting for BNB Chain confirmation…');
      const receiptStatus = await waitForReceipt(hash);
      if (receiptStatus === false) throw new Error(`Transaction ${hash} reverted on BNB Chain.`);
      let chainStatus: Record<string, any> = {};
      try { chainStatus = await getTransactionStatus(bearer, hash); } catch { /* RPC receipt is the fallback status source. */ }
      const confirmed = receiptStatus === true || String(chainStatus.status).toLowerCase() === 'success';
      setResult({ status: confirmed ? 'success' : 'pending', title: confirmed ? 'Trade complete' : 'Transaction submitted', detail: confirmed ? `${side === 'buy' ? 'Bought' : 'Sold'} ${market.symbol} on BNB Chain.` : 'Your transaction is on its way. Check the hash for its latest status.', hash });
    } catch (error) {
      setResult({ status: 'failed', title: 'Trade not completed', detail: error instanceof Error ? error.message : 'The transaction could not be completed.' });
    } finally {
      setBusy(false);
      setStep('');
    }
  };

  if (!market) return <Page><Txt>Markets are still loading.</Txt></Page>;
  const disabledReason = !auth.authenticated ? 'Sign in with Privy to request a real spot quote.' : !auth.walletReady ? 'Your embedded BNB Chain wallet is still preparing.' : source !== 'binance' ? 'Live Binance market data is not connected. Real quotes are disabled.' : !amountUnits ? 'Enter a valid amount.' : null;

  return (
    <Page contentStyle={{ gap: 14, paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={{ gap: 3 }}><Txt size={25} weight="semibold">Spot</Txt><Txt size={13} color={colors.mutedForeground}>Trade tokenized stocks on BNB Chain</Txt></View>
        <DemoBadge label={source === 'binance' ? 'BINANCE SPOT' : 'MARKET PREVIEW'} />
      </View>
      {auth.walletReady ? <Txt size={11} color={colors.mutedForeground}>Wallet {auth.walletAddress?.slice(0, 7)}…{auth.walletAddress?.slice(-5)} · BNB Smart Chain</Txt> : null}

      <View style={styles.directionRow}>
        {(['buy', 'sell'] as Side[]).map((item) => <Pressable key={item} onPress={() => { setSide(item); setAmount(item === 'buy' ? '25' : '0.1'); resetQuote(); }} style={[styles.direction, { backgroundColor: side === item ? colors.foreground : colors.card }]}><Txt size={14} weight="semibold" color={side === item ? colors.background : colors.mutedForeground}>{item === 'buy' ? 'Buy stock' : 'Sell stock'}</Txt></Pressable>)}
      </View>

      <Panel style={styles.tokenPanel}>
        <View style={styles.row}><Txt size={12} color={colors.mutedForeground}>{inputTokenLabel}</Txt><Txt size={11} color={colors.mutedForeground}>BNB Chain</Txt></View>
        <View style={styles.amountRow}>
          <TextInput value={amount} onChangeText={(value) => { setAmount(value); resetQuote(); }} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.mutedForeground} style={[styles.amountInput, { color: colors.foreground }]} accessibilityLabel="Token amount" />
          {side === 'buy' ? <Pressable onPress={() => setSheet('pay')} style={[styles.tokenPill, { backgroundColor: colors.secondary }]}><Txt size={14} weight="semibold">{stable.symbol}</Txt><Feather name="chevron-down" size={15} color={colors.mutedForeground} /></Pressable> : <Pressable onPress={() => setSheet('asset')} style={[styles.tokenPill, { backgroundColor: colors.secondary }]}><AssetMark market={market} size={26} /><Txt size={13} weight="semibold">{market.symbol}</Txt><Feather name="chevron-down" size={15} color={colors.mutedForeground} /></Pressable>}
        </View>
        <Txt size={11} color={colors.mutedForeground}>{side === 'buy' ? `Available balance is checked by your wallet before signing.` : `${market.name} · ${market.provider}`}</Txt>
      </Panel>

      <Pressable onPress={() => { const next = side === 'buy' ? 'sell' : 'buy'; setSide(next); setAmount(next === 'buy' ? '25' : '0.1'); resetQuote(); }} style={[styles.flip, { backgroundColor: colors.background, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Reverse trade direction"><Feather name="repeat" size={17} color={colors.primary} /></Pressable>

      <Panel style={styles.tokenPanel}>
        <View style={styles.row}><Txt size={12} color={colors.mutedForeground}>{outputTokenLabel}</Txt><Txt size={11} color={colors.mutedForeground}>Tokenized equity</Txt></View>
        <Pressable onPress={() => side === 'buy' ? setSheet('asset') : setSheet('pay')} style={styles.outputSelect}>
          {side === 'sell' ? <View style={[styles.stableIcon, { backgroundColor: colors.secondary }]}><Txt size={11} weight="bold" color={colors.primary}>{stable.symbol.slice(0, 1)}</Txt></View> : <AssetMark market={market} size={34} />}
          <View style={{ flex: 1, gap: 2 }}><Txt size={14} weight="semibold">{side === 'sell' ? stable.symbol : `${market.ticker} · ${market.provider}`}</Txt><Txt size={11} color={colors.mutedForeground}>{side === 'sell' ? 'USD stablecoin' : `${market.name} · ${market.symbol}`}</Txt></View>
          {side === 'sell' ? <Txt size={13} weight="semibold">{stable.symbol}</Txt> : <Pressable onPress={(event) => { event.stopPropagation(); setSheet('asset'); }} style={styles.change}><Txt size={11} weight="semibold" color={colors.primary}>Change</Txt></Pressable>}
          <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
        </Pressable>
      </Panel>

      {market.open ? null : <Panel style={[styles.notice, { borderColor: `${colors.destructive}66` }]}><Feather name="clock" size={16} color={colors.destructive} /><Txt size={12} color={colors.mutedForeground} style={{ flex: 1 }}>{market.ticker} market status: {market.marketStatus}. The quote route may be unavailable while the issuer market is closed.</Txt></Panel>}

      <Panel style={{ gap: 10 }}>
        <View style={styles.row}><Txt size={13} weight="medium">Quote</Txt><Pressable onPress={() => { resetQuote(); }} disabled={quoting}><Txt size={12} weight="semibold" color={colors.primary}>{quoting ? 'Refreshing…' : 'Refresh'}</Txt></Pressable></View>
        {quoting ? <View style={styles.quoteLoading}><ActivityIndicator color={colors.primary} /><Txt size={12} color={colors.mutedForeground}>Finding a spot route…</Txt></View> : quote ? <>
          <View style={styles.outputAmount}><Txt size={24} weight="semibold">{estimatedOutput ?? '—'}</Txt><Txt size={14} weight="semibold">{to?.symbol}</Txt></View>
          <View style={styles.row}><Txt size={11} color={colors.mutedForeground}>Route</Txt><Txt size={11} weight="medium">{quote.vendorName} · {quote.executionMode}</Txt></View>
          <View style={styles.row}><Txt size={11} color={colors.mutedForeground}>Price impact</Txt><Txt size={11} weight="medium">{quote.priceImpactPercent ?? '—'}%</Txt></View>
          <View style={styles.row}><Txt size={11} color={colors.mutedForeground}>Estimated network fee</Txt><Txt size={11} weight="medium">{quote.tradeFee ? money(Number(quote.tradeFee)) : 'Shown before confirmation'}</Txt></View>
          {!quoteFresh ? <Txt size={11} color={colors.destructive}>Quote is over 30 seconds old. Refresh before review.</Txt> : null}
        </> : <Txt size={12} color={colors.mutedForeground}>{quoteError || disabledReason || 'Enter an amount to get a live route quote.'}</Txt>}
      </Panel>

      <PrimaryButton title={busy ? step || 'Preparing trade…' : `Review ${side === 'buy' ? 'buy' : 'sell'}`} icon="arrow-up-right" onPress={() => setSheet('review')} disabled={!quote || !quoteFresh || Boolean(disabledReason) || busy} />
      {quoteError ? <Txt size={11} color={colors.destructive} style={{ textAlign: 'center' }}>{quoteError}</Txt> : null}
      {disabledReason ? <Txt size={11} color={colors.mutedForeground} style={{ textAlign: 'center' }}>{disabledReason}</Txt> : null}
      <Txt size={10} color={colors.mutedForeground} style={{ textAlign: 'center', lineHeight: 16 }}>Spot trades are on-chain or issuer RFQ orders. Review the actual quote and wallet confirmation before each trade.</Txt>

      <Modal transparent visible={sheet !== null} animationType="slide" onRequestClose={() => !busy && setSheet(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.scrim} onPress={() => !busy && setSheet(null)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.mutedForeground }]} />
            {sheet === 'asset' ? <>
              <View style={styles.sheetHeader}><Txt size={20} weight="semibold">Choose a stock token</Txt><Pressable onPress={() => setSheet(null)}><Feather name="x" size={21} color={colors.mutedForeground} /></Pressable></View>
              <Txt size={12} color={colors.mutedForeground}>Select the exact issuer and token representation on BNB Chain.</Txt>
              {markets.map((item) => <Pressable key={item.symbol} onPress={() => { setSymbol(item.symbol); state.setSelectedSymbol(item.symbol); resetQuote(); setSheet(null); }} style={[styles.marketOption, { borderColor: colors.border }]}><AssetMark market={item} size={38} /><View style={{ flex: 1, gap: 3 }}><Txt size={14} weight="semibold">{item.ticker} · {item.provider}</Txt><Txt size={11} color={colors.mutedForeground}>{item.name} · {item.symbol}</Txt></View><Txt size={12} weight="medium">{money(item.price)}</Txt></Pressable>)}
            </> : sheet === 'pay' ? <>
              <View style={styles.sheetHeader}><Txt size={20} weight="semibold">Choose stablecoin</Txt><Pressable onPress={() => setSheet(null)}><Feather name="x" size={21} color={colors.mutedForeground} /></Pressable></View>
              {STABLES.map((item) => <Pressable key={item.symbol} onPress={() => { setStable(item); resetQuote(); setSheet(null); }} style={[styles.marketOption, { borderColor: colors.border }]}><View style={[styles.stableIcon, { backgroundColor: colors.secondary }]}><Txt size={14} weight="bold" color={colors.primary}>{item.symbol[0]}</Txt></View><View style={{ flex: 1 }}><Txt size={14} weight="semibold">{item.symbol}</Txt><Txt size={11} color={colors.mutedForeground}>BNB Chain · {item.decimals} decimals</Txt></View><Feather name={stable.symbol === item.symbol ? 'check-circle' : 'circle'} size={19} color={stable.symbol === item.symbol ? colors.primary : colors.border} /></Pressable>)}
            </> : sheet === 'review' && quote ? <>
              <View style={styles.sheetHeader}><View><Txt size={20} weight="semibold">Review trade</Txt><Txt size={12} color={colors.mutedForeground}>BNB Smart Chain · 0.5% slippage</Txt></View><Pressable onPress={() => setSheet(null)} disabled={busy}><Feather name="x" size={21} color={colors.mutedForeground} /></Pressable></View>
              <View style={[styles.reviewTokens, { backgroundColor: colors.background }]}><View style={styles.reviewToken}><Txt size={10} color={colors.mutedForeground}>{inputTokenLabel.toUpperCase()}</Txt><Txt size={19} weight="semibold">{amount} {from?.symbol}</Txt></View><Feather name="arrow-down" size={18} color={colors.primary} /><View style={styles.reviewToken}><Txt size={10} color={colors.mutedForeground}>{receiveLabel.toUpperCase()} · ESTIMATED</Txt><Txt size={19} weight="semibold">{estimatedOutput ?? '—'} {to?.symbol}</Txt></View></View>
              <Row label="Provider / route" value={quote.vendorName} />
              <Row label="Execution" value={quote.executionMode === 'RFQ' ? 'Issuer RFQ · typed-data signature' : 'DEX swap · BNB Chain transaction'} />
              <Row label="Price impact" value={quote.priceImpactPercent ? `${quote.priceImpactPercent}%` : 'Not provided'} />
              <Row label="Network fee" value={quote.tradeFee ? money(Number(quote.tradeFee)) : 'Final gas shown by wallet'} />
              <Row label="Quote expires" value="Approximately 30 seconds after request" />
              {quote.approveTarget ? <Txt size={11} color={colors.mutedForeground} style={{ lineHeight: 16 }}>A separate token allowance may be requested. Review the token and spender in your wallet before approving.</Txt> : null}
              <Txt size={10} color={colors.mutedForeground} style={{ lineHeight: 15 }}>Tokenized stocks are third-party assets and may have limited liquidity, issuer-specific trading hours, and execution risk.</Txt>
              {busy ? <View style={styles.quoteLoading}><ActivityIndicator color={colors.primary} /><Txt size={12} color={colors.mutedForeground}>{step}</Txt></View> : null}
              <PrimaryButton title={busy ? step || 'Preparing…' : 'Confirm and continue'} icon="lock" onPress={() => void execute()} disabled={busy || !quoteFresh} />
              <Pressable onPress={() => setSheet(null)} style={styles.cancel}><Txt size={13} weight="medium" color={colors.mutedForeground}>Cancel</Txt></Pressable>
            </> : null}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(result)} animationType="fade" onRequestClose={() => setResult(null)}>
        <View style={styles.resultRoot}><View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: result?.status === 'success' ? `${colors.primary}22` : result?.status === 'pending' ? `${colors.promoPurple}22` : `${colors.destructive}22` }]}><Feather name={result?.status === 'success' ? 'check' : result?.status === 'pending' ? 'clock' : 'x'} size={30} color={result?.status === 'success' ? colors.primary : result?.status === 'pending' ? colors.promoPurple : colors.destructive} /></View>
          <Txt size={23} weight="semibold" style={{ textAlign: 'center' }}>{result?.title}</Txt><Txt size={13} color={colors.mutedForeground} style={{ lineHeight: 20, textAlign: 'center' }}>{result?.detail}</Txt>
          {result?.hash ? <Pressable onPress={() => router.push('/(tabs)/portfolio')} style={[styles.hashBox, { backgroundColor: colors.background }]}><Txt size={10} color={colors.mutedForeground}>TRANSACTION HASH</Txt><Txt size={11} weight="medium" numberOfLines={1}>{result.hash}</Txt><Txt size={11} weight="semibold" color={colors.primary}>View portfolio</Txt></Pressable> : null}
          {result?.status === 'success' ? <Txt size={11} color={colors.mutedForeground} style={{ textAlign: 'center' }}>Portfolio balances refresh from your wallet. The result above reflects the confirmed trade status.</Txt> : null}
          <PrimaryButton title="Done" onPress={() => { setResult(null); resetQuote(); }} />
        </View></View>
      </Modal>
    </Page>
  );
}

function makeRequestId() {
  return Crypto.randomUUID();
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  directionRow: { flexDirection: 'row', gap: 8, padding: 4, borderRadius: 18, backgroundColor: '#FFFFFF0B' },
  direction: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tokenPanel: { gap: 12, padding: 15 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amountInput: { flex: 1, minWidth: 0, fontSize: 30, fontFamily: 'Inter_600SemiBold', padding: 0 },
  tokenPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 22, paddingVertical: 8, paddingHorizontal: 10 },
  flip: { alignSelf: 'center', width: 37, height: 37, marginVertical: -27, zIndex: 2, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outputSelect: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 38 },
  change: { paddingHorizontal: 7, paddingVertical: 5 },
  stableIcon: { width: 32, height: 32, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1 },
  quoteLoading: { flexDirection: 'row', gap: 9, alignItems: 'center', minHeight: 28 },
  outputAmount: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0009' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, gap: 15, maxHeight: '88%' },
  handle: { width: 38, height: 4, borderRadius: 3, alignSelf: 'center', opacity: 0.6, marginBottom: 2 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  marketOption: { minHeight: 58, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewTokens: { borderRadius: 18, padding: 14, gap: 12 },
  reviewToken: { gap: 5 },
  cancel: { alignItems: 'center', padding: 5 },
  resultRoot: { flex: 1, backgroundColor: '#000A', justifyContent: 'center', padding: 22 },
  resultCard: { borderWidth: 1, borderRadius: 26, padding: 22, gap: 15, alignItems: 'stretch' },
  resultIcon: { alignSelf: 'center', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  hashBox: { borderRadius: 14, padding: 12, gap: 7 },
});
