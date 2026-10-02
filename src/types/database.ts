// Tipi allineati allo schema Supabase (supabase/schema.sql)
// In alternativa puoi generarli automaticamente con:
// npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts

export type BottleState = 'empty' | 'full';
export type MovementType = 'increment' | 'decrement';

export type BeerModel = {
  id: string;
  name: string;
  style: string | null;
  abv: number | null;
  ibu: number | null;
  description: string | null;
  qr_code: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  is_admin: boolean;
  created_at: string;
};

export type BottleInventory = {
  id: string;
  beer_model_id: string;
  empty_count: number;
  full_count: number;
  updated_at: string;
};

export type BottleMovement = {
  id: string;
  beer_model_id: string;
  state: BottleState;
  movement: MovementType;
  quantity: number;
  note: string | null;
  created_at: string;
  created_by: string | null;
};

// Vista "arricchita" usata nell'app: modello + relativo inventario
export interface BeerModelWithInventory extends BeerModel {
  inventory: BottleInventory | null;
}

// Payload per creare un nuovo modello di birra
export type CreateBeerModelInput = {
  name: string;
  style?: string;
  abv?: number;
  ibu?: number;
  description?: string;
  qr_code?: string;
};

// Definizione delle tabelle per il client Supabase tipizzato (opzionale)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, 'id'> & Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      beer_models: {
        Row: BeerModel;
        Insert: Partial<BeerModel> & { name: string };
        Update: Partial<BeerModel>;
        Relationships: [];
      };
      bottle_inventory: {
        Row: BottleInventory;
        Insert: Partial<BottleInventory> & { beer_model_id: string };
        Update: Partial<BottleInventory>;
        Relationships: [
          {
            foreignKeyName: 'bottle_inventory_beer_model_id_fkey';
            columns: ['beer_model_id'];
            isOneToOne: true;
            referencedRelation: 'beer_models';
            referencedColumns: ['id'];
          },
        ];
      };
      bottle_movements: {
        Row: BottleMovement;
        Insert: Partial<BottleMovement> & {
          beer_model_id: string;
          state: BottleState;
          movement: MovementType;
        };
        Update: Partial<BottleMovement>;
        Relationships: [
          {
            foreignKeyName: 'bottle_movements_beer_model_id_fkey';
            columns: ['beer_model_id'];
            isOneToOne: false;
            referencedRelation: 'beer_models';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      bottle_state: BottleState;
      movement_type: MovementType;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
