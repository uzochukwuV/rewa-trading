import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendAiChatMessage } from '@/data/ai-chat';
import type { AiChatMessage } from '@/data/ai-chat';
import { usePrivyAuth } from '@/context/PrivyAuth';
import { useColors } from '@/hooks/useColors';
import { Txt } from '@/components/ui';

type DisplayMessage = AiChatMessage & { id: string };

const GREETING: DisplayMessage = {
  id: 'greeting',
  role: 'assistant',
  content: 'Hi! I can look up tokenized stock markets and your BNB Chain stock holdings. What would you like to know?',
};

const SUGGESTIONS = ['What stocks are trading now?', 'Show my stock holdings'];

export default function AiChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const auth = usePrivyAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, sending]);

  const sendMessage = async (value = draft) => {
    const content = value.trim();
    const walletAddress = auth.walletAddress;
    if (!content || sending) return;
    if (!auth.authenticated || !walletAddress) {
      setError('Sign in and wait for your Privy wallet to finish loading before chatting.');
      return;
    }

    setDraft('');
    setError(null);
    setSending(true);
    const userMessage: DisplayMessage = { id: `${Date.now()}-user`, role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      const accessToken = await auth.getAccessToken();
      if (!accessToken) throw new Error('Your Privy session expired. Sign in again to continue.');
      const reply = await sendAiChatMessage({
        accessToken,
        walletAddress,
        messages: nextMessages.filter((message) => message.id !== 'greeting').map(({ role, content: text }) => ({ role, content: text })),
      });
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', content: reply }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reach the AI assistant. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="arrow-left" size={19} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTitle}>
            <View style={[styles.aiMark, { backgroundColor: colors.primary }]}><Feather name="zap" size={15} color={colors.primaryForeground} /></View>
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="semibold">Doto AI</Txt>
              <Txt size={11} color={colors.mutedForeground}>Tokenized stocks · BNB Chain</Txt>
            </View>
          </View>
          <View style={[styles.walletChip, { backgroundColor: colors.card }]}>
            <Feather name="user" size={12} color={colors.mutedForeground} />
            <Txt size={10} color={colors.mutedForeground}>{auth.walletAddress ? `${auth.walletAddress.slice(0, 6)}…${auth.walletAddress.slice(-4)}` : 'Wallet loading'}</Txt>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Txt size={14} style={styles.messageText}>{GREETING.content}</Txt>
          </View>
          {messages.slice(1).map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                message.role === 'user'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Txt size={14} color={message.role === 'user' ? colors.primaryForeground : colors.foreground} style={styles.messageText}>{message.content}</Txt>
            </View>
          ))}
          {sending ? (
            <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Txt size={12} color={colors.mutedForeground}>Checking live Binance data…</Txt>
            </View>
          ) : null}
          {messages.length === 1 && !sending ? (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable key={suggestion} onPress={() => { void sendMessage(suggestion); }} style={[styles.suggestion, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Txt size={12} color={colors.foreground}>{suggestion}</Txt>
                  <Feather name="arrow-up-right" size={14} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          ) : null}
          {error ? <Txt size={12} color={colors.destructive} style={styles.error}>{error}</Txt> : null}
        </ScrollView>

        <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask about markets or your holdings"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={2000}
            editable={!sending}
            onSubmitEditing={() => { void sendMessage(); }}
            returnKeyType="send"
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel="Message Doto AI"
          />
          <Pressable
            onPress={() => { void sendMessage(); }}
            disabled={!draft.trim() || sending || !auth.walletAddress}
            style={[styles.sendButton, { backgroundColor: colors.primary, opacity: !draft.trim() || sending || !auth.walletAddress ? 0.45 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Feather name="arrow-up" size={19} color={colors.primaryForeground} />
          </Pressable>
        </View>
        <Txt size={10} color={colors.mutedForeground} style={styles.disclaimer}>Informational only · AI responses can be inaccurate · No trades are placed</Txt>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { minHeight: 62, paddingHorizontal: 16, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  aiMark: { width: 31, height: 31, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  walletChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 7 },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, gap: 12, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '88%', borderRadius: 19, paddingVertical: 11, paddingHorizontal: 14 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6, borderWidth: 1 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  messageText: { lineHeight: 21 },
  typingBubble: { alignSelf: 'flex-start', borderRadius: 17, borderBottomLeftRadius: 6, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  suggestions: { gap: 8, marginTop: 2 },
  suggestion: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12 },
  error: { alignSelf: 'center', textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
  composer: { marginHorizontal: 14, borderRadius: 22, borderWidth: 1, padding: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 42, maxHeight: 112, paddingHorizontal: 9, paddingTop: 11, paddingBottom: 9, fontSize: 14, fontFamily: 'Inter_400Regular' },
  sendButton: { width: 40, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  disclaimer: { textAlign: 'center', paddingTop: 8, paddingBottom: 5 },
});
