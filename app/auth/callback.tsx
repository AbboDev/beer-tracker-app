import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, maxContentWidth, spacing, typography } from '../../src/theme';

export default function AuthCallbackScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { error_description: errorDescription, error } = useLocalSearchParams<{
    error?: string;
    error_description?: string;
  }>();
  const authError = errorDescription ?? error;

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {authError ? (
          <>
            <Text style={styles.title}>Accesso non riuscito</Text>
            <Text style={styles.message}>{authError}</Text>
            <Pressable onPress={() => router.replace('/login')} style={styles.button}>
              <Text style={styles.buttonLabel}>Torna all'accesso</Text>
            </Pressable>
          </>
        ) : loading || !session ? (
          <>
            <ActivityIndicator color={colors.amber} />
            <Text style={styles.message}>Completamento dell'accesso...</Text>
            {!loading && (
              <Pressable onPress={() => router.replace('/login')} style={styles.button}>
                <Text style={styles.buttonLabel}>Torna all'accesso</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Text style={styles.message}>Accesso completato...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  buttonLabel: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
  },
});
