import { useCallback, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getBeerModels } from '../../src/services/beerModels.service';
import type { BeerModelWithInventory } from '../../src/types/database';

export default function BeerModelsListScreen() {
  const router = useRouter();
  const [models, setModels] = useState<BeerModelWithInventory[]>([]);

  // Ricarica la lista ogni volta che la schermata torna in focus
  useFocusEffect(
    useCallback(() => {
      getBeerModels().then(setModels).catch(console.error);
    }, [])
  );

  return (
    <View>
      <Button title="Aggiungi modello" onPress={() => router.push('/beer-models/add')} />
      <FlatList
        data={models}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.style}</Text>
            <Text>
              Vuote: {item.inventory?.empty_count ?? 0} - Piene: {item.inventory?.full_count ?? 0}
            </Text>
            <Button title="Dettaglio" onPress={() => router.push(`/beer-models/${item.id}`)} />
          </View>
        )}
      />
    </View>
  );
}
