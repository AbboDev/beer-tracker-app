import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { getBeerModelByQrCode } from '../src/services/beerModels.service';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission) {
    return <Text>Verifica permessi fotocamera...</Text>;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>Serve il permesso per usare la fotocamera</Text>
        <Button title="Concedi permesso" onPress={requestPermission} />
      </View>
    );
  }

  async function handleScan(result: BarcodeScanningResult) {
    if (scanned) return;
    setScanned(true);
    setError(null);

    try {
      const model = await getBeerModelByQrCode(result.data);
      if (model) {
        router.replace(`/beer-models/${model.id}`);
      } else {
        setError('Nessun modello di birra trovato per questo QR code');
      }
    } catch (err: any) {
      setError(err.message ?? String(err));
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      {error && <Text>{error}</Text>}
      {scanned && <Button title="Scansiona di nuovo" onPress={() => setScanned(false)} />}
    </View>
  );
}
