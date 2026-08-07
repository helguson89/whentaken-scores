# WhenTaken Scores

Del og sammenlign daglige [WhenTaken](https://whentaken.com/)-resultater med venner. Lim inn delingsteksten fra spillet i stedet for å sende den i Messenger, så vises den automatisk i et delt leaderboard.

## Funksjoner

- **I dag** — leaderboard for siste runde som er lagt inn, med chat under dagens resultater
- **Legg til** — lim inn delingsteksten fra WhenTaken, se en forhåndsvisning, og lagre. Konfetti ved personlig rekord, og en egen fyrverkeri-animasjon når du setter dagens beste resultat
- **Statistikk** — snittscore, beste score, antall spilte runder og seire per spiller, kategori-toppen (best avstand, best år, mest konsistent) og en trendgraf over tid
- **Historikk** — se alle tidligere runder og resultatene for hver av dem, med egen kommentartråd per runde
- **Utvid en score** — trykk på et resultat for å se poengene per spørsmål (avstand, år, medalje), og reager med emoji på andres resultater
- **Push-varsler** — skru på 🔔 øverst til høyre for å få varsel på telefonen/PC-en når noen legger inn et resultat eller skriver i chatten
- **Lenke til dagens runde** — knapp øverst på "I dag"- og "Legg til"-sidene som åpner whentaken.com i ny fane

Det er **ingen innlogging eller grupper** — alle med lenken til appen deler samme leaderboard og kan legge inn resultat under hvilket som helst navn. Dette er en bevisst forenkling for en liten vennegjeng; se sikkerhetsnotatet nederst hvis dere vokser ut av det.

## Oppsett

### 1. Opprett et gratis Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com/) og opprett et nytt prosjekt (gratis tier er nok).
2. Åpne **SQL Editor** i prosjektet og kjør innholdet i [`supabase/schema.sql`](supabase/schema.sql). Dette oppretter `scores`-, `comments`-, `reactions`- og `push_subscriptions`-tabellene med tilgangsreglene.
3. Gå til **Project Settings → API** og noter:
   - **Project URL**
   - **anon public key**

> **Har du allerede kjørt en eldre versjon av `schema.sql`?** Kjør migrasjonene under `supabase/migrations/` som du ikke har kjørt ennå, i rekkefølge:
> - [`0002_comments_and_reactions.sql`](supabase/migrations/0002_comments_and_reactions.sql) — legger til `comments`- og `reactions`-tabellene (chat, kommentarer, reaksjoner).
> - [`0003_push_subscriptions.sql`](supabase/migrations/0003_push_subscriptions.sql) — legger til `push_subscriptions`-tabellen (push-varsler).
>
> Ikke kjør hele `schema.sql` på nytt — `CREATE POLICY` feiler hvis policyene allerede finnes.

### 2. Sett opp miljøvariabler lokalt

Kopier `.env.local.example` til `.env.local` og fyll inn verdiene fra Supabase:

```bash
cp .env.local.example .env.local
```

```
SUPABASE_URL=https://ditt-prosjekt.supabase.co
SUPABASE_ANON_KEY=din-anon-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=din-vapid-public-key
VAPID_PRIVATE_KEY=din-vapid-private-key
VAPID_SUBJECT=mailto:din-epost@example.com
```

VAPID-nøklene brukes til push-varsler (nytt resultat / ny chat-melding). Generer et nøkkelpar med:

```bash
npx web-push generate-vapid-keys
```

`VAPID_SUBJECT` skal være en `mailto:`-adresse push-tjenestene (Chrome/Firefox/Apple) kan kontakte deg på ved problemer — brukes ikke til noe annet.

### 3. Kjør appen lokalt

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

### 4. Deploy til Vercel

1. Push repoet til GitHub.
2. Importer prosjektet på [vercel.com/new](https://vercel.com/new).
3. Legg inn `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` og `VAPID_SUBJECT` som miljøvariabler i Vercel-prosjektet (samme verdier som i `.env.local`).
4. Deploy — del lenken med vennene dine.

Push-varsler krever en sikker kontekst (HTTPS). De fleste nettlesere behandler `localhost` som sikkert under utvikling, men de er tryggest å teste på selve Vercel-deployen.

## Slik lager du en delingstekst i WhenTaken

Etter en runde velger du "Del", og limer hele teksten inn i **Legg til**-siden i appen, f.eks.:

```
#WhenTaken #878 (24.07.2026)

I scored 818/1000🏅

1️⃣📍744 km - 🗓️9 yrs - 🥈165/200
2️⃣📍516 m - 🗓️11 yrs - 🥇182/200
3️⃣📍8.0K km - 🗓️5 yrs - 🥉103/200
4️⃣📍611 km - 🗓️8 yrs - 🥈171/200
5️⃣📍1.6 km - 🗓️3 yrs - 🥇197/200
 https://whentaken.com/
```

Appen tolker rundenummer, dato, totalscore og hver enkelt rundes distanse/år/medalje/poeng.

## Sikkerhetsnotat

Databasen har åpne tilgangsregler (Row Level Security tillater alle å lese, legge til og oppdatere rader). Det finnes ingen autentisering, så hvem som helst med lenken kan i teorien legge inn score under et annet navn enn sitt eget. Dette er en akseptert avveining for en liten, tillitsbasert vennegjeng. Hvis appen skal brukes av en større eller mindre tillitsfull gruppe, bør dere legge til ekte innlogging (f.eks. Supabase Auth) og stramme inn policyene i [`supabase/schema.sql`](supabase/schema.sql).

## Tech stack

- [Next.js](https://nextjs.org) (App Router, Server Actions)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres + RLS, ingen egen backend nødvendig)
- [Recharts](https://recharts.org) (trendgraf i statistikken)
- [canvas-confetti](https://www.kirilv.com/canvas-confetti/) (feiring ved personlig rekord / dagens beste)
- [web-push](https://github.com/web-push-libs/web-push) (push-varsler via en service worker, [`public/sw.js`](public/sw.js))

## Tester

Parseren for delingsteksten har enhetstester:

```bash
npx vitest run
```
