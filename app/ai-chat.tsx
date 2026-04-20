import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { RESTAURANTS } from '@/data/mockData';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; suggestions?: boolean };
type AvailabilityTone = 'red' | 'orange' | 'green';

const PROMPTS = [
  'Something romantic for 2',
  'Family dinner tonight',
  'Quick lunch near me',
  'Outdoor terrace, warm evening',
];

const AVAIL_PILL = {
  green: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
  orange: { bg: '#FFEDD5', border: '#FB923C', text: '#C2410C' },
  red: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
} as const;

function toneForAvailabilityLeft(n: number): AvailabilityTone {
  if (n <= 1) return 'red';
  if (n <= 5) return 'orange';
  return 'green';
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    backBtn: {
      paddingVertical: Spacing.sm,
      paddingRight: Spacing.xs,
      marginLeft: -Spacing.xs,
    },
    avatarWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.aiMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.aiBorder,
    },
    avatarImg: { width: 26, height: 26, tintColor: c.ai },
    headerInfo: { flex: 1 },
    headerTitle: { fontWeight: '800', fontSize: 17, color: c.text },
    headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
    headerSub: { fontSize: 13, color: c.textSecondary },
    clearBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
    },
    clearBtnText: { color: c.textSecondary, fontWeight: '600', fontSize: 13 },

    // Chat list
    chatContent: { padding: Spacing.md, paddingBottom: Spacing.lg },

    // Bubbles
    bubbleWrap: { marginBottom: 12 },
    bubbleRowAi: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
    bubbleRowUser: { alignItems: 'flex-end' },
    aiAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.aiMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.aiBorder,
      marginBottom: 2,
    },
    aiAvatarImg: { width: 15, height: 15, tintColor: c.ai },
    bubble: { maxWidth: '78%', paddingHorizontal: Spacing.md, paddingVertical: 12, borderRadius: Radius.lg },
    bubbleAi: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderBottomLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: c.primary,
      borderBottomRightRadius: 4,
    },
    bubbleText: { color: c.text, lineHeight: 22, fontSize: 15 },
    bubbleTextUser: { color: '#fff' },

    // Prompt chips grid
    promptsSection: { paddingTop: Spacing.md, gap: Spacing.sm },
    promptsRow: { flexDirection: 'row', gap: Spacing.sm },
    promptChip: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    promptChipText: { fontWeight: '600', color: c.text, fontSize: 13, textAlign: 'center' },

    // Suggestion cards
    suggestScroll: { flexGrow: 0 },
    suggestRow: {
      marginTop: Spacing.sm,
      paddingLeft: 28 + Spacing.sm,
      paddingRight: Spacing.md,
      gap: Spacing.sm,
      alignItems: 'center',
    },
    suggestCard: {
      width: 172,
      backgroundColor: c.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    suggestImg: { width: '100%', height: 104 },
    suggestBody: { padding: Spacing.sm },
    suggestName: { fontWeight: '800', color: c.text, fontSize: 14, marginBottom: 2 },
    suggestMeta: { color: c.textSecondary, fontSize: 12 },
    suggestBadge: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    suggestBadgeRed: { backgroundColor: AVAIL_PILL.red.bg, borderColor: AVAIL_PILL.red.border },
    suggestBadgeOrange: { backgroundColor: AVAIL_PILL.orange.bg, borderColor: AVAIL_PILL.orange.border },
    suggestBadgeGreen: { backgroundColor: AVAIL_PILL.green.bg, borderColor: AVAIL_PILL.green.border },
    suggestBadgeText: { fontSize: 11, fontWeight: '700' },
    suggestBadgeTextRed: { color: AVAIL_PILL.red.text },
    suggestBadgeTextOrange: { color: AVAIL_PILL.orange.text },
    suggestBadgeTextGreen: { color: AVAIL_PILL.green.text },
    suggestBadgeMuted: {
      alignSelf: 'flex-start',
      marginTop: 6,
      backgroundColor: c.chipMuted,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radius.full,
    },
    suggestBadgeMutedText: { fontSize: 11, fontWeight: '700', color: c.textMuted },

    // Typing indicator
    typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: 12 },
    typingBubble: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.lg,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      gap: 5,
      alignItems: 'center',
    },
    typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.ai },

    // Input bar
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      gap: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.card,
    },
    input: {
      flex: 1,
      backgroundColor: c.inputBg,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    sendBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: c.inputBg,
      borderWidth: 1,
      borderColor: c.border,
    },
  });
}

function leaveChat() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}

export default function AiChatScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const isFirstMessage = messages.length === 1;
  const hasInput = input.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            onPress={leaveChat}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <FontAwesome name="chevron-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.avatarWrap}>
            <Image
              source={require('../assets/images/ai-sparkles.png')}
              style={styles.avatarImg}
              contentFit="contain"
              accessibilityLabel="AI assistant"
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Concierge</Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSub}>Online · ready to help</Text>
            </View>
          </View>
          <Pressable onPress={reset} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={styles.bubbleWrap}>
              {item.role === 'assistant' ? (
                <>
                  <View style={styles.bubbleRowAi}>
                    <View style={styles.aiAvatar}>
                      <Image
                        source={require('../assets/images/ai-sparkles.png')}
                        style={styles.aiAvatarImg}
                        contentFit="contain"
                      />
                    </View>
                    <View style={[styles.bubble, styles.bubbleAi]}>
                      <Text style={styles.bubbleText}>{item.text}</Text>
                    </View>
                  </View>
                  {item.suggestions ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.suggestScroll}
                      contentContainerStyle={styles.suggestRow}>
                      {RESTAURANTS.slice(0, 3).map((r) => (
                        <Pressable key={r.id} style={styles.suggestCard} onPress={() => router.push(`/restaurant/${r.id}`)}>
                          <Image source={{ uri: r.image }} style={styles.suggestImg} contentFit="cover" />
                          <View style={styles.suggestBody}>
                            <Text style={styles.suggestName} numberOfLines={1}>{r.name}</Text>
                            <Text style={styles.suggestMeta}>{r.rating} ★ · {r.vibes[0]}</Text>
                            {r.availabilityTonight != null ? (
                              <View
                                style={[
                                  styles.suggestBadge,
                                  toneForAvailabilityLeft(r.availabilityTonight) === 'red'
                                    ? styles.suggestBadgeRed
                                    : toneForAvailabilityLeft(r.availabilityTonight) === 'orange'
                                      ? styles.suggestBadgeOrange
                                      : styles.suggestBadgeGreen,
                                ]}>
                                <Text
                                  style={[
                                    styles.suggestBadgeText,
                                    toneForAvailabilityLeft(r.availabilityTonight) === 'red'
                                      ? styles.suggestBadgeTextRed
                                      : toneForAvailabilityLeft(r.availabilityTonight) === 'orange'
                                        ? styles.suggestBadgeTextOrange
                                        : styles.suggestBadgeTextGreen,
                                  ]}>
                                  {r.availabilityTonight} left
                                </Text>
                              </View>
                            ) : r.fullTonight ? (
                              <View style={styles.suggestBadgeMuted}>
                                <Text style={styles.suggestBadgeMutedText}>Full tonight</Text>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </>
              ) : (
                <View style={styles.bubbleRowUser}>
                  <View style={[styles.bubble, styles.bubbleUser]}>
                    <Text style={[styles.bubbleText, styles.bubbleTextUser]}>{item.text}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            typing ? (
              <View style={styles.typingRow}>
                <View style={styles.aiAvatar}>
                  <Image
                    source={require('../assets/images/ai-sparkles.png')}
                    style={styles.aiAvatarImg}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { opacity: 0.3 }]} />
                </View>
              </View>
            ) : isFirstMessage ? (
              <View style={styles.promptsSection}>
                <View style={styles.promptsRow}>
                  <Pressable style={styles.promptChip} onPress={() => send(PROMPTS[0])}>
                    <Text style={styles.promptChipText}>{PROMPTS[0]}</Text>
                  </Pressable>
                  <Pressable style={styles.promptChip} onPress={() => send(PROMPTS[1])}>
                    <Text style={styles.promptChipText}>{PROMPTS[1]}</Text>
                  </Pressable>
                </View>
                <View style={styles.promptsRow}>
                  <Pressable style={styles.promptChip} onPress={() => send(PROMPTS[2])}>
                    <Text style={styles.promptChipText}>{PROMPTS[2]}</Text>
                  </Pressable>
                  <Pressable style={styles.promptChip} onPress={() => send(PROMPTS[3])}>
                    <Text style={styles.promptChipText}>{PROMPTS[3]}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null
          }
          contentContainerStyle={styles.chatContent}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable style={[styles.sendBtn, !hasInput && styles.sendBtnDisabled]} onPress={() => send(input)}>
            <FontAwesome name="paper-plane" size={17} color={hasInput ? '#fff' : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
