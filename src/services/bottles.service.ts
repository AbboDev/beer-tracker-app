import { supabase } from '../lib/supabase';
import type { BottleInventory, BottleState } from '../types/database';

interface AdjustParams {
  beerModelId: string;
  state: BottleState; // 'empty' | 'full'
  delta: number; // positivo per incremento, negativo per decremento
  note?: string;
}

/**
 * Funzione generica per modificare il contatore di bottiglie vuote o piene
 * di un modello di birra, e registrare il movimento nello storico.
 *
 * In produzione conviene spostare questa logica in una Postgres function
 * (RPC) per garantire atomicità; qui la teniamo lato client per semplicità.
 */
export async function adjustBottleCount({
  beerModelId,
  state,
  delta,
  note,
}: AdjustParams): Promise<BottleInventory> {
  if (delta === 0) throw new Error('Il delta non può essere 0');

  // 1. Leggo il valore corrente
  const { data: current, error: readError } = await supabase
    .from('bottle_inventory')
    .select('*')
    .eq('beer_model_id', beerModelId)
    .single();

  if (readError) throw readError;

  const currentValue = state === 'empty' ? current.empty_count : current.full_count;
  const newValue = currentValue + delta;
  if (newValue < 0) {
    throw new Error('Il numero di bottiglie non può essere negativo');
  }

  // 2. Aggiorno il contatore
  const update = state === 'empty' ? { empty_count: newValue } : { full_count: newValue };
  const { data: updated, error: updateError } = await supabase
    .from('bottle_inventory')
    .update(update)
    .eq('beer_model_id', beerModelId)
    .select()
    .single();

  if (updateError) throw updateError;

  // 3. Registro il movimento nello storico
  const { error: logError } = await supabase.from('bottle_movements').insert({
    beer_model_id: beerModelId,
    state,
    movement: delta > 0 ? 'increment' : 'decrement',
    quantity: Math.abs(delta),
    note: note ?? null,
  });

  if (logError) throw logError;

  return updated as BottleInventory;
}

// Scorciatoie comode da chiamare dalle schermate

export const incrementEmpty = (beerModelId: string, qty = 1) =>
  adjustBottleCount({ beerModelId, state: 'empty', delta: qty });

export const decrementEmpty = (beerModelId: string, qty = 1) =>
  adjustBottleCount({ beerModelId, state: 'empty', delta: -qty });

export const incrementFull = (beerModelId: string, qty = 1) =>
  adjustBottleCount({ beerModelId, state: 'full', delta: qty });

export const decrementFull = (beerModelId: string, qty = 1) =>
  adjustBottleCount({ beerModelId, state: 'full', delta: -qty });

/**
 * Esempio "imbottigliamento": sposta N bottiglie da vuote a piene
 * (decrementa empty, incrementa full) in un'unica operazione logica.
 */
export async function bottleUp(beerModelId: string, qty = 1) {
  await decrementEmpty(beerModelId, qty);
  await incrementFull(beerModelId, qty);
}

/**
 * Esempio "consumo": una bottiglia piena viene bevuta e torna vuota.
 */
export async function drinkOne(beerModelId: string, qty = 1) {
  await decrementFull(beerModelId, qty);
  await incrementEmpty(beerModelId, qty);
}
