# Beer Tracker App

App Expo (React Native + TypeScript) per tracciare le bottiglie di birra
homemade: modelli/ricette, bottiglie vuote/piene, identificazione tramite QR code.

## Struttura del progetto

```
beer-tracker-app/
├── app/                        # Schermate (Expo Router, file-based routing)
│   ├── _layout.tsx             # Stack di navigazione root
│   ├── index.tsx                # Home: riepilogo + lista modelli
│   ├── scan.tsx                  # Scansione QR code
│   └── beer-models/
│       ├── index.tsx            # Lista completa modelli di birra
│       ├── add.tsx              # Form nuovo modello
│       └── [id].tsx             # Dettaglio modello + incremento/decremento
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Client Supabase
│   ├── types/
│   │   └── database.ts          # Tipi TypeScript (BeerModel, Inventory, ...)
│   └── services/
│       ├── beerModels.service.ts  # CRUD modelli di birra
│       └── bottles.service.ts     # Incremento/decremento bottiglie
├── supabase/
│   └── schema.sql               # Schema DB (tabelle, trigger, RLS)
├── app.json
├── package.json
├── tsconfig.json
└── .env.example
```

## Modello dati e permessi

- **profiles**: una riga per utente autenticato, creata automaticamente al primo
  accesso. Il flag `is_admin` decide chi può scrivere — **non è auto-assegnabile
  dall'app**, va impostato a mano su Supabase (SQL editor):
  ```sql
  update profiles set is_admin = true where email = 'tu@esempio.com';
  ```
- **beer_models**: catalogo condiviso dei modelli di birra (nome, stile, ABV, IBU,
  descrizione, `qr_code`). Ha `created_by`/`updated_by` + `updated_at`, valorizzati
  automaticamente da un trigger lato DB (il client non può falsificarli).
- **bottle_inventory**: 1 riga per modello, con `empty_count` e `full_count`,
  creata automaticamente quando nasce un `beer_model`.
- **bottle_movements**: log di ogni incremento/decremento con `created_by` e
  `created_at` — la traccia di chi ha modificato cosa e quando.

**Chi vede/scrive cosa:**
- `beer_models` e `bottle_inventory`: **lettura pubblica**, anche senza login.
  Scrittura (creare/modificare/eliminare birre, cambiare i contatori) solo per
  chi ha `is_admin = true`.
- `bottle_movements`: solo gli admin possono leggerlo e scriverlo (è un log
  interno, non pensato per il pubblico).

Il frontend nasconde i pulsanti di scrittura a chi non è admin, ma la vera
barriera è lato database (RLS): anche aggirando l'app, nessuno scrive senza
il flag giusto in `profiles`.

## Versioni

Progetto allineato a **Expo SDK 57** (React Native 0.86, React 19.2.3), che richiede
**Node.js 22.13.x o superiore** — quindi Node 24 LTS va benissimo. Dopo aver clonato
o scaricato il progetto esegui `npx expo install --fix` per far allineare Expo alle
versioni esatte compatibili di tutte le dipendenze native (`expo-camera`,
`expo-router`, ecc.), invece di fissarle a mano nel `package.json`.

## Setup

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Esegui il contenuto di `supabase/schema.sql` nello SQL editor di Supabase.
3. Copia `.env.example` in `.env` e inserisci `EXPO_PUBLIC_SUPABASE_URL` e
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (li trovi in Project Settings > API).
4. Installa le dipendenze:
   ```bash
   npm install
   ```
5. Avvia il progetto:
   ```bash
   npx expo start
   ```

## Login con Google

L'app usa Supabase Auth con provider Google (SSO). Il codice è già pronto
(`src/contexts/AuthContext.tsx`, `app/login.tsx`), ma va configurato lato
Google Cloud Console e Supabase — sono passaggi manuali, non di codice.

### 1. Google Cloud Console

1. Crea (o riusa) un progetto su [console.cloud.google.com](https://console.cloud.google.com).
2. Vai su **APIs & Services > OAuth consent screen** e configuralo (basta "External"
   + i dati minimi per iniziare, anche in modalità "Testing").
3. Vai su **APIs & Services > Credentials > Create Credentials > OAuth client ID**,
   tipo applicazione **Web application**.
4. In **Authorized redirect URIs** aggiungi l'URL di callback di Supabase (lo trovi
   nel passo 2 sotto, ha la forma `https://<PROJECT_REF>.supabase.co/auth/v1/callback`).
5. Copia **Client ID** e **Client Secret**.

### 2. Supabase

1. Nel tuo progetto Supabase vai su **Authentication > Providers > Google**.
2. Attivalo e incolla **Client ID** e **Client Secret** ottenuti da Google.
3. Copia da qui l'URL di callback da usare nel punto 4 sopra.
4. Vai su **Authentication > URL Configuration > Redirect URLs** e aggiungi:
   - `beertracker://auth/callback` (per iOS/Android, corrisponde allo `scheme`
     in `app.json`)
   - l'URL locale di sviluppo web, es. `http://localhost:8081/auth/callback`
   - l'URL di produzione del sito, se/quando pubblichi la versione web

### 3. Dopo aver eseguito lo schema: promuovi te stesso ad admin

Senza questo passaggio nessuno (nemmeno tu da loggato) può scrivere:
1. Accedi una volta dall'app con Google, così Supabase crea il tuo `profiles`.
2. Nello SQL editor di Supabase:
   ```sql
   update profiles set is_admin = true where email = 'tu@esempio.com';
   ```

### 4. Nota sullo schema DB

Questa versione dello schema **non è compatibile** con le precedenti (quella
con `user_id` su `beer_models` per l'isolamento per-utente): il modello ora è
"catalogo condiviso pubblico in lettura, scrittura riservata agli admin".
Se hai già eseguito una versione precedente dello schema su Supabase e non hai
dati importanti, la via più semplice è ripartire da zero:
```sql
drop table if exists bottle_movements, bottle_inventory, beer_models, profiles cascade;
drop function if exists is_admin, handle_new_user, create_inventory_for_new_model,
  set_beer_model_audit_fields, set_updated_at cascade;
```
poi rieseguire per intero `supabase/schema.sql`. Se invece vuoi conservare i
dati esistenti, serve una migrazione manuale — chiedimelo pure se ti serve lo script.

## Note sul QR code

Il campo `qr_code` su `beer_models` è il valore testuale che stamperai/codificherai
nel QR sul bollino (es. `BEER-IPA-001`). La schermata `scan.tsx` legge il QR con
`expo-camera`, cerca il modello corrispondente e apre direttamente il suo dettaglio,
dove puoi incrementare/decrementare le bottiglie.

## Prossimi passi suggeriti

- Generare il QR code direttamente in app (es. libreria `react-native-qrcode-svg`)
  quando crei un nuovo modello, invece di inserirlo manualmente.
- Spostare `adjustBottleCount` in una funzione RPC Postgres per garantire
  atomicità (evitare race condition tra letture/scritture concorrenti).
- Aggiungere schermata statistiche basata su `bottle_movements`.
