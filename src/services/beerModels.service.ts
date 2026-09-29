import { supabase } from '../lib/supabase';
import type {
  BeerModel,
  BeerModelWithInventory,
  CreateBeerModelInput,
} from '../types/database';

/**
 * Recupera tutti i modelli di birra con il relativo inventario (join).
 */
export async function getBeerModels(): Promise<BeerModelWithInventory[]> {
  const { data, error } = await supabase
    .from('beer_models')
    .select('*, inventory:bottle_inventory(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // bottle_inventory è 1:1 ma supabase-js lo ritorna come array nella join: normalizziamo
  return (data ?? []).map((row: any) => ({
    ...row,
    inventory: Array.isArray(row.inventory) ? row.inventory[0] ?? null : row.inventory,
  }));
}

/**
 * Recupera un singolo modello di birra tramite id, con inventario.
 */
export async function getBeerModelById(id: string): Promise<BeerModelWithInventory | null> {
  const { data, error } = await supabase
    .from('beer_models')
    .select('*, inventory:bottle_inventory(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    inventory: Array.isArray((data as any).inventory)
      ? (data as any).inventory[0] ?? null
      : (data as any).inventory,
  };
}

/**
 * Recupera un modello di birra a partire dal contenuto del QR code scansionato.
 */
export async function getBeerModelByQrCode(
  qrCode: string
): Promise<BeerModelWithInventory | null> {
  const { data, error } = await supabase
    .from('beer_models')
    .select('*, inventory:bottle_inventory(*)')
    .eq('qr_code', qrCode)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    inventory: Array.isArray((data as any).inventory)
      ? (data as any).inventory[0] ?? null
      : (data as any).inventory,
  };
}

/**
 * Crea un nuovo modello di birra.
 * L'inventario (0 vuote, 0 piene) viene creato automaticamente dal trigger DB.
 */
export async function createBeerModel(input: CreateBeerModelInput): Promise<BeerModel> {
  const { data, error } = await supabase
    .from('beer_models')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as BeerModel;
}

/**
 * Aggiorna i dati anagrafici di un modello di birra.
 */
export async function updateBeerModel(
  id: string,
  changes: Partial<CreateBeerModelInput>
): Promise<BeerModel> {
  const { data, error } = await supabase
    .from('beer_models')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BeerModel;
}

/**
 * Elimina un modello di birra (cascata su inventory e movements).
 */
export async function deleteBeerModel(id: string): Promise<void> {
  const { error } = await supabase.from('beer_models').delete().eq('id', id);
  if (error) throw error;
}
