import { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { getBeerModels } from '../src/services/beerModels.service';
import { useAuth } from '../src/contexts/AuthContext';
import type { BeerModelWithInventory } from '../src/types/database';

export default function HomeScreen() {
  const router = useRouter();
  const { session, isAdmin, signOut } = useAuth();
  const [models, setModels] = useState<BeerModelWithInventory[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await getBeerModels();
      setModels(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalEmpty = models.reduce((sum, m) => sum + (m.inventory?.empty_count ?? 0), 0);
  const totalFull = models.reduce((sum, m) => sum + (m.inventory?.full_count ?? 0), 0);

  return (
    <View>
      {session?.user?.email ? (
        <View>
          <Text>
            Connesso come {session.user.email} {isAdmin ? '(admin)' : '(sola lettura)'}
          </Text>
          <Button title="Esci" onPress={signOut} />
        </View>
      ) : (
        <Button title="Accedi" onPress={() => router.push('/login')} />
      )}

      <Text>Bottiglie vuote totali: {totalEmpty}</Text>
      <Text>Bottiglie piene totali: {totalFull}</Text>

      <Button title="Scansiona QR" onPress={() => router.push('/scan')} />
      <Button title="Vedi tutti i modelli" onPress={() => router.push('/beer-models')} />
      {isAdmin && (
        <Button title="Aggiungi modello" onPress={() => router.push('/beer-models/add')} />
      )}

      {loading ? (
        <Text>Caricamento...</Text>
      ) : (
        <FlatList
          data={models}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <Text>{item.name}</Text>
              <Text>
                Vuote: {item.inventory?.empty_count ?? 0} / Piene: {item.inventory?.full_count ?? 0}
              </Text>
              <Button
                title="Apri"
                onPress={() => router.push(`/beer-models/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}
