-- ==========================================================
-- SCHEMA: Beer Bottle Tracker
-- Catalogo condiviso: tutti (anche senza login) possono leggere.
-- Solo gli utenti flaggati is_admin=true possono scrivere.
-- Ogni modifica registra automaticamente chi e quando.
-- ==========================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------
-- PROFILES
-- Una riga per ogni utente autenticato, creata automaticamente
-- al primo login. is_admin NON è auto-assegnabile dall'app:
-- va impostato a mano da chi amministra il database, es.:
--   update profiles set is_admin = true where email = 'tu@esempio.com';
-- ----------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crea automaticamente il profilo quando un utente si registra/accede la prima volta
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funzione di appoggio per le policy: true se l'utente corrente è admin.
-- security definer perché deve poter leggere profiles indipendentemente
-- dalla policy di lettura di profiles stessa.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

alter table profiles enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- ----------------------------------------------------------
-- BEER MODELS
-- Catalogo condiviso dei modelli di birra.
-- ----------------------------------------------------------
create table if not exists beer_models (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  style text,
  abv numeric(4,2),
  ibu integer,
  description text,
  qr_code text unique,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- ----------------------------------------------------------
-- BOTTLE INVENTORY
-- Contatore corrente vuote/piene per ciascun modello (1:1 con beer_models).
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
-- BOTTLE MOVEMENTS
-- Log di ogni incremento/decremento: chi, quando, cosa.
-- ----------------------------------------------------------
create type bottle_state as enum ('empty', 'full');
create type movement_type as enum ('increment', 'decrement');

create table if not exists bottle_movements (
  id uuid primary key default uuid_generate_v4(),
  beer_model_id uuid not null references beer_models(id) on delete cascade,
  state bottle_state not null,
  movement movement_type not null,
  quantity integer not null default 1 check (quantity > 0),
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

-- ----------------------------------------------------------
-- Trigger: crea automaticamente l'inventario per un nuovo modello
-- ----------------------------------------------------------
create or replace function create_inventory_for_new_model()
returns trigger as $$
begin
  insert into bottle_inventory (beer_model_id, empty_count, full_count)
  values (new.id, 0, 0);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_create_inventory on beer_models;
create trigger trg_create_inventory
after insert on beer_models
for each row execute function create_inventory_for_new_model();

-- ----------------------------------------------------------
-- Trigger: valorizza sempre created_by/updated_by/updated_at su beer_models
-- lato server, così il client non può falsificare chi ha modificato cosa.
-- ----------------------------------------------------------
create or replace function set_beer_model_audit_fields()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    new.updated_at := now();
  elsif tg_op = 'UPDATE' then
    new.updated_by := auth.uid();
    new.updated_at := now();
    new.created_by := old.created_by;   -- non modificabile dopo la creazione
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_beer_models_audit on beer_models;
create trigger trg_beer_models_audit
before insert or update on beer_models
for each row execute function set_beer_model_audit_fields();

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

drop trigger if exists trg_inventory_updated_at on bottle_inventory;
create trigger trg_inventory_updated_at
before update on bottle_inventory
for each row execute function set_updated_at();

-- ----------------------------------------------------------
-- ROW LEVEL SECURITY
-- Lettura pubblica (anche senza login) su catalogo e inventario.
-- Scrittura riservata agli utenti con profiles.is_admin = true.
-- Il log dei movimenti è visibile e scrivibile solo dagli admin.
-- ----------------------------------------------------------
alter table beer_models enable row level security;
alter table bottle_inventory enable row level security;
alter table bottle_movements enable row level security;

create policy "public read" on beer_models
  for select using (true);
create policy "admin insert" on beer_models
  for insert with check (is_admin());
create policy "admin update" on beer_models
  for update using (is_admin()) with check (is_admin());
create policy "admin delete" on beer_models
  for delete using (is_admin());

create policy "public read" on bottle_inventory
  for select using (true);
create policy "admin insert" on bottle_inventory
  for insert with check (is_admin());
create policy "admin update" on bottle_inventory
  for update using (is_admin()) with check (is_admin());
create policy "admin delete" on bottle_inventory
  for delete using (is_admin());

create policy "admin read" on bottle_movements
  for select using (is_admin());
create policy "admin insert" on bottle_movements
  for insert with check (is_admin());
