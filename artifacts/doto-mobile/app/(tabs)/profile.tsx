import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppState } from '@/context/AppState';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { money } from '@/data/market';
import { useWalletStablecoins } from '@/hooks/useWalletStablecoins';
import { useColors } from '@/hooks/useColors';
import { DemoBadge, Page, Panel, PrimaryButton, SectionHeading, Txt } from '@/components/ui';

function ProfileItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.72 }]}>
      <View style={[styles.itemIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={18} color={colors.foreground} /></View>
      <View style={{ flex: 1, gap: 3 }}><Txt size={14} weight="medium">{title}</Txt><Txt size={11} color={colors.mutedForeground}>{subtitle}</Txt></View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const state = useAppState();
  const auth = usePrivyAuth();
  const { balanceUsd, loading: balanceLoading, error: balanceError } = useWalletStablecoins();
  const showInfo = (title: string, detail: string) => Alert.alert(title, detail);
  const signOut = () => Alert.alert(auth.authenticated ? 'Sign out?' : 'Leave preview mode?', 'Sample trades and preferences stay saved on this device.', [
    { text: 'Stay here', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => {
      void (async () => {
        if (auth.authenticated) await auth.logout();
        state.signOut();
        router.replace('/');
      })();
    } },
  ]);

  return (
    <Page>
      <View style={styles.header}>
        <View><Txt size={25} weight="semibold">Account</Txt><Txt size={13} color={colors.mutedForeground}>{auth.authenticated ? 'Privy account' : 'Preview account'}</Txt></View>
        <DemoBadge label={auth.authenticated ? 'PRIVY' : 'DEMO'} />
      </View>
      <Panel style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Txt size={23} weight="bold" color={colors.primaryForeground}>{auth.authenticated ? 'P' : state.userName.charAt(0).toUpperCase()}</Txt>
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Txt size={17} weight="semibold">{auth.authenticated ? 'Privy user' : state.userName}</Txt>
          <Txt size={12} color={colors.mutedForeground} numberOfLines={1}>{auth.authenticated ? `Account ${auth.userId ?? ''}` : 'Preview trader · Sample profile'}</Txt>
        </View>
        <Pressable onPress={() => showInfo('Profile', auth.authenticated ? 'Your account is authenticated with Privy.' : 'This profile is stored locally for the preview.')} accessibilityLabel="Account information">
          <Feather name="edit-2" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Panel>
      <View style={styles.statGrid}>
        {[
          { label: 'Wallet', value: balanceLoading && balanceUsd === null ? '…' : auth.walletAddress && balanceUsd !== null ? money(balanceUsd) : '—' },
          { label: 'Favorites', value: String(state.favorites.length) },
          { label: 'Trades', value: String(state.positions.length) },
        ].map((item) => (
          <Panel key={item.label} style={styles.statCard}>
            <Txt size={11} color={colors.mutedForeground}>{item.label}</Txt>
            <Txt size={15} weight="semibold" numberOfLines={1}>{item.value}</Txt>
          </Panel>
        ))}
      </View>
      <SectionHeading title={auth.authenticated ? 'Privy wallet' : 'Preview account'} />
      <Panel style={{ paddingVertical: 2, paddingHorizontal: 13, gap: 0 }}>
        <ProfileItem icon="credit-card" title={auth.walletReady ? 'BNB Smart Chain wallet' : 'Wallet status'} subtitle={auth.authenticated ? (auth.walletAddress ?? auth.error ?? 'Preparing your embedded wallet…') : 'No real wallet in preview mode'} onPress={() => showInfo('Embedded wallet', auth.walletAddress ? `${auth.walletAddress}\nNetwork: BNB Smart Chain (chain ID 56)` : auth.authenticated ? auth.error ?? 'Privy is preparing the embedded BNB Smart Chain wallet.' : 'Configure Privy to create an embedded wallet after sign-in.')} />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
        <ProfileItem icon="user" title="Identity" subtitle={auth.authenticated ? `Privy user ${auth.userId ?? ''}` : 'Local preview identity'} onPress={() => showInfo('Identity', auth.authenticated ? 'Your app session is managed by Privy.' : 'This identity is local sample data.')} />
        {auth.authenticated && balanceError ? <Txt size={11} color={colors.destructive}>{balanceError}</Txt> : null}
      </Panel>
      <SectionHeading title="Help and information" />
      <Panel style={{ paddingVertical: 2, paddingHorizontal: 13, gap: 0 }}>
        <ProfileItem icon="message-circle" title="Chat with support" subtitle="Support is not connected in the demo" onPress={() => showInfo('Support', 'This sample app does not send messages to a support team.')} />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
        <ProfileItem icon="file-text" title="Risk disclosure" subtitle="Trading involves risk" onPress={() => showInfo('Risk disclosure', 'This is a UI prototype with simulated prices and orders. It is not an investment service or financial advice.')} />
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
        <ProfileItem icon="settings" title="App preferences" subtitle="Notifications, language and security" onPress={() => showInfo('Preferences', 'App preferences are not connected in this demo.')} />
      </Panel>
      <PrimaryButton title={auth.authenticated ? 'Sign out' : 'Leave preview mode'} icon="log-out" variant="outline" onPress={signOut} />
      <Txt size={11} color={colors.mutedForeground} style={{ textAlign: 'center' }}>{auth.authenticated ? 'Authentication and embedded wallet provided by Privy · Trading is not enabled' : 'Preview mode · No real account or wallet access'}</Txt>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 54, height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statGrid: { flexDirection: 'row', gap: 9 },
  statCard: { flex: 1, paddingHorizontal: 12, paddingVertical: 13, gap: 7 },
  item: { minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  itemIcon: { width: 37, height: 37, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
