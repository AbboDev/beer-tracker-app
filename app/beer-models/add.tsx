import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createBeerModel } from '../../src/services/beerModels.service';

export default function AddBeerModelScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [style, setStyle] = useState('');
  const [abv, setAbv] = useState('');
  const [ibu, setIbu] = useState('');
  const [description, setDescription] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Il nome è obbligatorio');
      return;
    }
    setSaving(true);
    try {
      await createBeerModel({
        name: name.trim(),
        style: style || undefined,
        abv: abv ? Number(abv) : undefined,
        ibu: ibu ? Number(ibu) : undefined,
        description: description || undefined,
        qr_code: qrCode || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Errore', err.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Text>Nome</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Es. IPA Estiva" />

      <Text>Stile</Text>
      <TextInput value={style} onChangeText={setStyle} placeholder="Es. American IPA" />

      <Text>ABV (%)</Text>
      <TextInput value={abv} onChangeText={setAbv} keyboardType="decimal-pad" />

      <Text>IBU</Text>
      <TextInput value={ibu} onChangeText={setIbu} keyboardType="number-pad" />

      <Text>Descrizione</Text>
      <TextInput value={description} onChangeText={setDescription} multiline />

      <Text>Codice QR (opzionale, lo puoi anche generare dopo)</Text>
      <TextInput value={qrCode} onChangeText={setQrCode} placeholder="Es. BEER-IPA-001" />

      <Button title={saving ? 'Salvataggio...' : 'Salva'} onPress={handleSave} disabled={saving} />
    </View>
  );
}
