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

## Modello dati

- **beer_models**: le "ricette"/tipi di birra che produci (nome, stile, ABV, IBU,
  descrizione, `qr_code` univoco associato al bollino stampato).
- **bottle_inventory**: 1 riga per modello, con `empty_count` e `full_count`.
  Viene creata automaticamente da un trigger quando crei un nuovo `beer_model`.
- **bottle_movements**: log storico di ogni incremento/decremento, utile per
  statistiche future (es. "quante IPA ho imbottigliato questo mese").

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

## Note su autenticazione e RLS

Lo schema attuale presuppone un solo utente autenticato proprietario di tutti
i dati (policy RLS "authenticated"). Se in futuro vuoi supportare più utenti,
aggiungi una colonna `user_id uuid references auth.users` su `beer_models` e
aggiorna le policy per filtrare su `auth.uid() = user_id`.

## Note sul QR code

Il campo `qr_code` su `beer_models` è il valore testuale che stamperai/codificherai
nel QR sul bollino (es. `BEER-IPA-001`). La schermata `scan.tsx` legge il QR con
`expo-camera`, cerca il modello corrispondente e apre direttamente il suo dettaglio,
dove puoi incrementare/decrementare le bottiglie.

## Prossimi passi suggeriti

- Generare il QR code direttamente in app (es. libreria `react-native-qrcode-svg`)
  quando crei un nuovo modello, invece di inserirlo manualmente.
- Aggiungere autenticazione (Supabase Auth) se l'app dovrà essere multi-utente.
- Spostare `adjustBottleCount` in una funzione RPC Postgres per garantire
  atomicità (evitare race condition tra letture/scritture concorrenti).
- Aggiungere schermata statistiche basata su `bottle_movements`.
