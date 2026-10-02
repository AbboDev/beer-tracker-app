import { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useNavigation } from 'expo-router';
import { getBeerModelById } from '../../src/services/beerModels.service';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  incrementEmpty,
  decrementEmpty,
  incrementFull,
  decrementFull,
  bottleUp,
  drinkOne,
} from '../../src/services/bottles.service';
import type { BeerModelWithInventory } from '../../src/types/database';
import { colors, typography, spacing, maxContentWidth } from '../../src/theme';

export default function BeerModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { isAdmin } = useAuth();
  const [model, setModel] = useState<BeerModelWithInventory | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await getBeerModelById(id);
    setModel(data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Il titolo della schermata diventa il nome della birra, non resta generico
  useLayoutEffect(() => {
    if (model) navigation.setOptions({ title: model.name });
  }, [model, navigation]);

  async function runAndReload(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!model) {
    return (
      <View style={styles.screen}>
        <Text style={styles.muted}>Caricamento…</Text>
      </View>
    );
  }

  const empty = model.inventory?.empty_count ?? 0;
  const full = model.inventory?.full_count ?? 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Intestazione: nome, stile */}
        <Text style={styles.name}>{model.name}</Text>
        {model.style ? <Text style={styles.style}>{model.style}</Text> : null}

        {/* Dati tecnici: ABV / IBU, in monospace perché sono dati */}
        <View style={styles.specsRow}>
          {model.abv != null && (
            <Text style={styles.spec}>
              <Text style={styles.specValue}>{model.abv}%</Text> ABV
            </Text>
          )}
          {model.abv != null && model.ibu != null && <View style={styles.specDivider} />}
          {model.ibu != null && (
            <Text style={styles.spec}>
              <Text style={styles.specValue}>{model.ibu}</Text> IBU
            </Text>
          )}
        </View>

        {model.description ? (
          <>
            <View style={styles.hairline} />
            <Text style={styles.description}>{model.description}</Text>
          </>
        ) : null}

        <View style={styles.hairline} />

        {/* Inventario: piene / vuote (controlli di modifica solo per gli admin) */}
        <View style={styles.countsRow}>
          <CountBlock
            label="Piene"
            value={full}
            accent={colors.amber}
            editable={isAdmin}
            onIncrement={() => runAndReload(() => incrementFull(model.id))}
            onDecrement={() => runAndReload(() => decrementFull(model.id))}
            disabled={busy}
          />
          <View style={styles.countsDivider} />
          <CountBlock
            label="Vuote"
            value={empty}
            accent={colors.sage}
            editable={isAdmin}
            onIncrement={() => runAndReload(() => incrementEmpty(model.id))}
            onDecrement={() => runAndReload(() => decrementEmpty(model.id))}
            disabled={busy}
          />
        </View>

        {isAdmin && (
          <>
            <View style={styles.hairline} />

            {/* Azioni rapide: spostano bottiglie tra uno stato e l'altro */}
            <View style={styles.actionsRow}>
              <TextAction
                label="Imbottiglia una vuota"
                onPress={() => runAndReload(() => bottleUp(model.id))}
                disabled={busy || empty === 0}
              />
              <TextAction
                label="Segna una bevuta"
                onPress={() => runAndReload(() => drinkOne(model.id))}
                disabled={busy || full === 0}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function CountBlock({
  label,
  value,
  accent,
  editable,
  onIncrement,
  onDecrement,
  disabled,
}: {
  label: string;
  value: number;
  accent: string;
  editable: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.countBlock}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={[styles.countValue, { color: accent }]}>{value}</Text>
      {editable && (
        <View style={styles.stepperRow}>
          <StepButton symbol="–" onPress={onDecrement} disabled={disabled || value === 0} />
          <StepButton symbol="+" onPress={onIncrement} disabled={disabled} />
        </View>
      )}
    </View>
  );
}

function StepButton({
  symbol,
  onPress,
  disabled,
}: {
  symbol: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.stepButtonPressed,
        disabled && styles.stepButtonDisabled,
      ]}
    >
      {({ pressed }) => (
        <Text style={[styles.stepButtonText, pressed && styles.stepButtonTextPressed]}>
          {symbol}
        </Text>
      )}
    </Pressable>
  );
}

function TextAction({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.textAction}>
      <Text style={[styles.textActionLabel, disabled && styles.textActionLabelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  muted: {
    color: colors.inkMuted,
    fontFamily: typography.body,
    padding: spacing.lg,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 36,
    lineHeight: 42,
    color: colors.ink,
  },
  style: {
    fontFamily: typography.body,
    fontSize: 16,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  spec: {
    fontFamily: typography.mono,
    fontSize: 13,
    color: colors.inkMuted,
  },
  specValue: {
    color: colors.ink,
  },
  specDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.hairline,
    marginHorizontal: spacing.sm,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.lg,
  },
  description: {
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    maxWidth: 480,
  },
  countsRow: {
    flexDirection: 'row',
  },
  countsDivider: {
    width: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: spacing.lg,
  },
  countBlock: {
    flex: 1,
  },
  countLabel: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  countValue: {
    fontFamily: typography.display,
    fontSize: 48,
    marginTop: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepButtonPressed: {
    backgroundColor: colors.ink,
  },
  stepButtonDisabled: {
    borderColor: colors.hairline,
  },
  stepButtonText: {
    fontFamily: typography.mono,
    fontSize: 18,
    color: colors.ink,
  },
  stepButtonTextPressed: {
    color: colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  textAction: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingBottom: 2,
  },
  textActionLabel: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.ink,
  },
  textActionLabelDisabled: {
    color: colors.inkMuted,
  },
});
