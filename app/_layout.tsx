import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Le mie birre' }} />
      <Stack.Screen name="beer-models/index" options={{ title: 'Modelli di birra' }} />
      <Stack.Screen name="beer-models/add" options={{ title: 'Nuovo modello' }} />
      <Stack.Screen name="beer-models/[id]" options={{ title: 'Dettaglio' }} />
      <Stack.Screen name="scan" options={{ title: 'Scansiona QR' }} />
    </Stack>
  );
}
