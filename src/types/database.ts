// Tipi allineati allo schema Supabase (supabase/schema.sql)
// In alternativa puoi generarli automaticamente con:
// npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts

export type BottleState = 'empty' | 'full';
export type MovementType = 'increment' | 'decrement';

export interface BeerModel {
  id: string;
  name: string;
  style: string | null;
  abv: number | null;
  ibu: number | null;
  description: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface BottleInventory {
  id: string;
  beer_model_id: string;
  empty_count: number;
  full_count: number;
  updated_at: string;
}

export interface BottleMovement {
  id: string;
  beer_model_id: string;
  state: BottleState;
  movement: MovementType;
  quantity: number;
  note: string | null;
  created_at: string;
}

// Vista "arricchita" usata nell'app: modello + relativo inventario
export interface BeerModelWithInventory extends BeerModel {
  inventory: BottleInventory | null;
}

// Payload per creare un nuovo modello di birra
export interface CreateBeerModelInput {
  name: string;
  style?: string;
  abv?: number;
  ibu?: number;
  description?: string;
  qr_code?: string;
}

// Definizione delle tabelle per il client Supabase tipizzato (opzionale)
export interface Database {
  public: {
    Tables: {
      beer_models: {
        Row: BeerModel;
        Insert: Partial<BeerModel> & { name: string };
        Update: Partial<BeerModel>;
      };
      bottle_inventory: {
        Row: BottleInventory;
        Insert: Partial<BottleInventory> & { beer_model_id: string };
        Update: Partial<BottleInventory>;
      };
      bottle_movements: {
        Row: BottleMovement;
        Insert: Partial<BottleMovement> & {
          beer_model_id: string;
          state: BottleState;
          movement: MovementType;
        };
        Update: Partial<BottleMovement>;
      };
    };
  };
}
