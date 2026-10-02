import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { colors, typography, spacing, maxContentWidth } from '../src/theme';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePress() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Le mie birre</Text>
        <Text style={styles.subtitle}>
          Tieni traccia delle tue bottiglie, vuote e piene, modello per modello.
        </Text>

        <View style={styles.hairline} />

        <Pressable
          onPress={handlePress}
          disabled={loading}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonLabel}>Accedi con Google</Text>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  },
  container: {
    width: '100%',
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 32,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    maxWidth: 360,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.lg,
  },
  button: {
    backgroundColor: colors.ink,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    backgroundColor: colors.amber,
  },
  buttonLabel: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.background,
  },
  error: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.md,
  },
});
