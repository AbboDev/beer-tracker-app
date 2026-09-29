-- ==========================================================
-- SCHEMA: Beer Bottle Tracker
-- ==========================================================

-- Estensione per generare UUID
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------
-- Tabella: beer_models
-- I "modelli" di birra che produci (es. IPA casalinga, Stout invernale...)
-- ----------------------------------------------------------
create table if not exists beer_models (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                 -- nome della ricetta/birra
  style text,                         -- stile birrario (IPA, Stout, Weizen...)
  abv numeric(4,2),                   -- gradazione alcolica
  ibu integer,                        -- amaro (opzionale)
  description text,
  qr_code text unique,                -- codice/valore contenuto nel QR stampato sul bollino
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Tabella: bottle_inventory
-- Contatore corrente di bottiglie vuote/piene per ciascun modello.
-- Relazione 1:1 con beer_models (un solo record di stato per modello).
-- ----------------------------------------------------------
create table if not exists bottle_inventory (
  id uuid primary key default uuid_generate_v4(),
  beer_model_id uuid not null references beer_models(id) on delete cascade,
  empty_count integer not null default 0 check (empty_count >= 0),
  full_count integer not null default 0 check (full_count >= 0),
  updated_at timestamptz not null default now(),
  unique (beer_model_id)
);

-- ----------------------------------------------------------
-- Tabella: bottle_movements
-- Log storico di ogni incremento/decremento (utile per audit e statistiche).
-- ----------------------------------------------------------
create type bottle_state as enum ('empty', 'full');
create type movement_type as enum ('increment', 'decrement');

create table if not exists bottle_movements (
  id uuid primary key default uuid_generate_v4(),
  beer_model_id uuid not null references beer_models(id) on delete cascade,
  state bottle_state not null,        -- su quale contatore agisce (empty/full)
  movement movement_type not null,    -- incremento o decremento
  quantity integer not null default 1 check (quantity > 0),
  note text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Trigger: crea automaticamente la riga di inventory quando
-- viene creato un nuovo beer_model
-- ----------------------------------------------------------
create or replace function create_inventory_for_new_model()
returns trigger as $$
begin
  insert into bottle_inventory (beer_model_id, empty_count, full_count)
  values (new.id, 0, 0);
  return new;
end;
$$ language plpgsql;

create trigger trg_create_inventory
after insert on beer_models
for each row execute function create_inventory_for_new_model();

-- ----------------------------------------------------------
-- Trigger: aggiorna updated_at su bottle_inventory
-- ----------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_inventory_updated_at
before update on bottle_inventory
for each row execute function set_updated_at();

-- ----------------------------------------------------------
-- Row Level Security (da adattare in base al tuo modello di auth)
-- Esempio semplice: singolo utente proprietario di tutto (nessuna colonna user_id).
-- Se prevedi multi-utente, aggiungi una colonna user_id uuid references auth.users
-- su ogni tabella e aggiorna le policy di conseguenza.
-- ----------------------------------------------------------
alter table beer_models enable row level security;
alter table bottle_inventory enable row level security;
alter table bottle_movements enable row level security;

create policy "allow all to authenticated" on beer_models
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "allow all to authenticated" on bottle_inventory
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "allow all to authenticated" on bottle_movements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
