import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Theme, Radius, Spacing } from '@/constants/Theme';
import { RESTAURANTS } from '@/data/mockData';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; suggestions?: boolean };

const PROMPTS = ['Something romantic for 2', 'Family dinner tonight', 'Quick lunch near me', 'Outdoor terrace, warm evening'];

export default function AiChatScreen() {
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'm0',
      role: 'assistant',
      text: "Hi — I'm here to help you find a table. Try one of the prompts below or describe your night in your own words.",
    },
  ]);
  const listRef = useRef<FlatList>(null);

  const pushAssistant = useCallback((text: string, withSuggestions?: boolean) => {
    setMessages((m) => [...m, { id: String(Date.now()), role: 'assistant', text, suggestions: withSuggestions }]);
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { id: String(Date.now()) + 'u', role: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushAssistant(
        'Here are a few spots that match — availability updates live. Tap a card to view the restaurant.',
        true,
      );
    }, 900);
  };

  const reset = () => {
    setMessages([
      {
        id: 'm0',
        role: 'assistant',
        text: "Conversation cleared. Tell me what you're in the mood for.",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Concierge</Text>
            <Text style={styles.headerSub}>Online · ready to help</Text>
          </View>
          <Pressable onPress={reset} style={styles.clearHeader}>
            <Text style={styles.clearHeaderText}>Clear</Text>
          </Pressable>
        </View>

        {messages.length === 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts}>
            {PROMPTS.map((p) => (
              <Pressable key={p} onPress={() => send(p)} style={styles.promptChip}>
                <Text style={styles.promptChipText}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrap, item.role === 'user' && styles.bubbleWrapUser]}>
              <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>{item.text}</Text>
              </View>
              {item.suggestions ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestRow}>
                  {RESTAURANTS.slice(0, 3).map((r) => (
                    <Pressable key={r.id} style={styles.suggestCard} onPress={() => router.push(`/restaurant/${r.id}`)}>
                      <Image source={{ uri: r.image }} style={styles.suggestImg} contentFit="cover" />
                      <Text style={styles.suggestName} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text style={styles.suggestMeta}>
                        {r.rating} ★ · {r.vibes[0]}
                      </Text>
                      {r.availabilityTonight != null ? (
                        <View style={styles.suggestBadge}>
                          <Text style={styles.suggestBadgeText}>{r.availabilityTonight} left</Text>
                        </View>
                      ) : r.fullTonight ? (
                        <View style={[styles.suggestBadge, { backgroundColor: '#E5E7EB' }]}>
                          <Text style={[styles.suggestBadgeText, { color: Theme.textMuted }]}>Full tonight</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>
          )}
          ListFooterComponent={
            typing ? (
              <View style={styles.typing}>
                <Text style={styles.typingDot}>●</Text>
                <Text style={[styles.typingDot, { opacity: 0.6 }]}>●</Text>
                <Text style={[styles.typingDot, { opacity: 0.3 }]}>●</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.chatContent}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything…"
            placeholderTextColor={Theme.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
          />
          <Pressable style={styles.send} onPress={() => send(input)}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.aiMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4CFF5',
  },
  avatarText: { fontWeight: '900', color: Theme.ai },
  headerTitle: { fontWeight: '800', fontSize: 17, color: Theme.text },
  headerSub: { color: Theme.textSecondary, fontSize: 13 },
  clearHeader: { marginLeft: 'auto', padding: Spacing.sm },
  clearHeaderText: { color: Theme.ai, fontWeight: '700' },
  prompts: { gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  promptChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  promptChipText: { fontWeight: '600', color: Theme.text },
  chatContent: { padding: Spacing.md, paddingBottom: Spacing.lg },
  bubbleWrap: { marginBottom: Spacing.md },
  bubbleWrapUser: { alignItems: 'flex-end' },
  bubble: { maxWidth: '92%', padding: Spacing.md, borderRadius: Radius.lg },
  bubbleAi: { backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.border },
  bubbleUser: { backgroundColor: Theme.ai },
  bubbleText: { color: Theme.text, lineHeight: 22, fontSize: 15 },
  bubbleTextUser: { color: '#fff' },
  suggestRow: { marginTop: Spacing.sm, gap: Spacing.sm },
  suggestCard: {
    width: 160,
    backgroundColor: Theme.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
  },
  suggestImg: { width: '100%', height: 88 },
  suggestName: { fontWeight: '800', paddingHorizontal: Spacing.sm, marginTop: Spacing.sm, color: Theme.text },
  suggestMeta: { paddingHorizontal: Spacing.sm, color: Theme.textSecondary, fontSize: 12, marginBottom: Spacing.sm },
  suggestBadge: {
    alignSelf: 'flex-start',
    marginLeft: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Theme.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  suggestBadgeText: { fontSize: 11, fontWeight: '700', color: Theme.primary },
  typing: { flexDirection: 'row', gap: 6, paddingLeft: Spacing.sm, marginBottom: Spacing.md },
  typingDot: { color: Theme.ai, fontSize: 18 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    backgroundColor: Theme.card,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.text,
  },
  send: { backgroundColor: Theme.ai, paddingHorizontal: Spacing.md, paddingVertical: 12, borderRadius: Radius.full },
  sendText: { color: '#fff', fontWeight: '800' },
});
