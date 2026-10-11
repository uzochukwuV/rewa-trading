import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '@/context/AppState';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { useColors } from '@/hooks/useColors';
import { Brand, DemoBadge, MiniChart, PrimaryButton, Txt } from '@/components/ui';

type Flow = 'splash' | 'welcome' | 'email';

function OnboardingChart() {
  const colors = useColors();
  return (
    <View style={styles.illustration}>
      <MiniChart height={218} color={colors.primary} />
      <View style={[styles.coin, { backgroundColor: colors.bitcoin }]}>
        <Txt size={53} weight="bold" color={colors.foreground}>$</Txt>
      </View>
      <View style={[styles.upBadge, { backgroundColor: colors.primary }]}>
        <Feather name="arrow-up-right" size={22} color={colors.primaryForeground} />
      </View>
      <View style={[styles.gainBadge, { backgroundColor: colors.primary }]}>
        <Txt size={16} weight="bold" color={colors.primaryForeground}>BNB</Txt>
      </View>
    </View>
  );
}

function Splash({ analyzing, message }: { analyzing: boolean; message?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      {message ? (
        <>
          <Brand />
          <Txt size={13} color={colors.mutedForeground} style={styles.centerText}>{message}</Txt>
        </>
      ) : analyzing ? (
        <>
          <View style={[styles.pulseOuter, { borderColor: colors.primary }]} />
          <View style={[styles.pulse, { backgroundColor: colors.primary }]} />
          <Txt size={15} color={colors.foreground}>{message ?? 'Restoring your secure session…'}</Txt>
        </>
      ) : <Brand />}
    </View>
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const session = useAppState();
  const auth = usePrivyAuth();
  const [flow, setFlow] = useState<Flow>('splash');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.ready) return;
    if (auth.configured && !auth.ready) {
      setFlow('splash');
      return;
    }
    if (auth.configured && auth.authenticated) {
      router.replace('/(tabs)');
      return;
    }
    const timer = setTimeout(() => setFlow('welcome'), 850);
    return () => clearTimeout(timer);
  }, [session.ready, auth.configured, auth.ready, auth.authenticated, router]);

  const runAuth = async (action: () => Promise<void>) => {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const sendEmailCode = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setEmail(normalizedEmail);
    void runAuth(async () => {
      await auth.sendEmailCode(normalizedEmail);
      setCodeSent(true);
    });
  };

  if (!session.ready || (auth.configured && !auth.ready) || flow === 'splash') {
    return <Splash analyzing={session.ready && (!auth.configured || auth.ready)} message={auth.error ? `Privy could not initialize: ${auth.error}` : undefined} />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      {flow === 'email' ? (
        <View style={styles.contactPage}>
          <Pressable onPress={() => { setFlow('welcome'); setCodeSent(false); setCode(''); setError(null); }} style={styles.backButton} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Brand small />
          <Txt size={27} weight="semibold">{codeSent ? 'Check your email' : 'Sign in with email'}</Txt>
          <Txt size={14} color={colors.mutedForeground}>
            {codeSent ? `Enter the one-time code sent to ${email}.` : 'We’ll email you a one-time sign-in code.'}
          </Txt>
          {!codeSent ? (
            <TextInput
              testID="email-input"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="name@example.com"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.contactInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            />
          ) : (
            <TextInput
              testID="email-code-input"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              placeholder="One-time code"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.contactInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            />
          )}
          {error ? <Txt size={13} color={colors.destructive}>{error}</Txt> : null}
          <PrimaryButton
            title={pending ? 'Please wait…' : codeSent ? 'Verify and sign in' : 'Send sign-in code'}
            disabled={pending || auth.busy}
            onPress={() => codeSent
              ? void runAuth(() => auth.loginWithEmailCode(email, code.trim()))
              : sendEmailCode()}
          />
          {codeSent ? <Pressable onPress={sendEmailCode} accessibilityRole="button"><Txt size={13} color={colors.mutedForeground}>Send a new code</Txt></Pressable> : null}
        </View>
      ) : flow === 'welcome' ? (
        <ScrollView contentContainerStyle={styles.welcomePage} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeTop}>
            <Brand />
            <DemoBadge label={auth.supported ? 'PRIVY AUTH' : 'SETUP REQUIRED'} />
          </View>
          <OnboardingChart />
          <View style={styles.welcomeCopy}>
            <Txt size={31} weight="semibold" style={styles.welcomeTitle}>Explore tokenized stocks.</Txt>
            <Txt size={16} color={colors.mutedForeground} style={styles.centerText}>
              Browse BNB Chain stock tokens and review every step before a transaction.
            </Txt>
          </View>
          <View style={styles.authActions}>
            {auth.supported ? (
              <>
                <PrimaryButton title={pending ? 'Connecting…' : 'Continue with Google'} icon="globe" variant="white" disabled={pending || auth.busy} onPress={() => void runAuth(auth.loginWithGoogle)} />
                <PrimaryButton title="Continue with Apple" icon="smartphone" variant="dark" disabled={pending || auth.busy} onPress={() => void runAuth(auth.loginWithApple)} />
                <View style={styles.orRow}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <Txt size={13} color={colors.mutedForeground}>or</Txt>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                </View>
                <PrimaryButton title="Continue with email" icon="mail" variant="outline" disabled={pending || auth.busy} onPress={() => { setEmail(''); setCode(''); setCodeSent(false); setError(null); setFlow('email'); }} />
                {error ? <Txt size={13} color={colors.destructive} style={styles.centerText}>{error}</Txt> : null}
                <Txt size={11} color={colors.mutedForeground} style={styles.centerText}>Sign-in is secured by Privy. Your embedded wallet is created after login.</Txt>
              </>
            ) : (
              <Txt size={13} color={colors.destructive} style={styles.centerText}>
                {auth.configured
                  ? 'Privy sign-in requires the native Android or iOS app. Open a native build to sign in.'
                  : 'Privy sign-in is unavailable. Configure EXPO_PUBLIC_PRIVY_APP_ID and EXPO_PUBLIC_PRIVY_CLIENT_ID, then rebuild the app.'}
              </Txt>
            )}
            <Txt size={11} color={colors.mutedForeground} style={styles.legalText}>
              By continuing, you agree to the <Txt size={11} color={colors.foreground}>Risk Disclosure</Txt> and <Txt size={11} color={colors.foreground}>Terms of Service</Txt>.
            </Txt>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  pulseOuter: { width: 66, height: 66, borderRadius: 40, borderWidth: 8, opacity: 0.12, position: 'absolute' },
  pulse: { width: 22, height: 22, borderRadius: 15 },
  welcomePage: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, minHeight: '100%', justifyContent: 'space-between', gap: 16 },
  welcomeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  illustration: { height: 214, justifyContent: 'center', overflow: 'visible' },
  coin: { position: 'absolute', width: 112, height: 112, borderRadius: 58, alignItems: 'center', justifyContent: 'center', right: 52, top: 12, elevation: 8 },
  upBadge: { position: 'absolute', right: 34, top: 7, width: 46, height: 46, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  gainBadge: { position: 'absolute', top: 133, left: 94, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  welcomeCopy: { gap: 5, alignItems: 'center' },
  welcomeTitle: { textAlign: 'center', lineHeight: 39 },
  centerText: { textAlign: 'center', lineHeight: 22 },
  authActions: { gap: 14, paddingBottom: 4 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, flex: 1 },
  authOptions: { flexDirection: 'row', justifyContent: 'center', gap: 18 },
  authCircle: { width: 58, height: 58, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  legalText: { textAlign: 'center', lineHeight: 17 },
  backButton: { alignSelf: 'flex-start', padding: 8 },
  contactPage: { flex: 1, padding: 22, paddingTop: 12, gap: 17 },
  contactInput: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Inter_500Medium', marginTop: 6 },
});
