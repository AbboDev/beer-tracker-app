import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Il frontend è pubblico: non reindirizziamo mai via dal contenuto.
  // L'unica cosa che facciamo è riportare alla home chi, dopo essersi
  // collegato, si trova ancora sulla schermata di login.
  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === 'login';
    if (session && onLoginScreen) {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: 'Accedi' }} />
      <Stack.Screen name="auth/callback" options={{ title: 'Accesso', headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Le mie birre' }} />
      <Stack.Screen name="beer-models/index" options={{ title: 'Modelli di birra' }} />
      <Stack.Screen name="beer-models/add" options={{ title: 'Nuovo modello' }} />
      <Stack.Screen name="beer-models/[id]" options={{ title: 'Dettaglio' }} />
      <Stack.Screen name="scan" options={{ title: 'Scansiona QR' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
