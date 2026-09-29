import { useCallback, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getBeerModelById } from '../../src/services/beerModels.service';
import {
  incrementEmpty,
  decrementEmpty,
  incrementFull,
  decrementFull,
  bottleUp,
  drinkOne,
} from '../../src/services/bottles.service';
import type { BeerModelWithInventory } from '../../src/types/database';

export default function BeerModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [model, setModel] = useState<BeerModelWithInventory | null>(null);

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

  async function runAndReload(action: () => Promise<unknown>) {
    await action();
    await load();
  }

  if (!model) return <Text>Caricamento...</Text>;

  return (
    <View>
      <Text>{model.name}</Text>
      <Text>{model.style}</Text>
      <Text>ABV: {model.abv ?? '-'}% - IBU: {model.ibu ?? '-'}</Text>
      <Text>{model.description}</Text>

      <Text>Bottiglie vuote: {model.inventory?.empty_count ?? 0}</Text>
      <Button title="+1 vuota" onPress={() => runAndReload(() => incrementEmpty(model.id))} />
      <Button title="-1 vuota" onPress={() => runAndReload(() => decrementEmpty(model.id))} />

      <Text>Bottiglie piene: {model.inventory?.full_count ?? 0}</Text>
      <Button title="+1 piena" onPress={() => runAndReload(() => incrementFull(model.id))} />
      <Button title="-1 piena" onPress={() => runAndReload(() => decrementFull(model.id))} />

      <Text>Azioni rapide</Text>
      <Button
        title="Imbottiglia 1 (vuota -1, piena +1)"
        onPress={() => runAndReload(() => bottleUp(model.id))}
      />
      <Button
        title="Bevi 1 (piena -1, vuota +1)"
        onPress={() => runAndReload(() => drinkOne(model.id))}
      />
    </View>
  );
}
