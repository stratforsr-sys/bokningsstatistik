# Telink Mötesstatistik - Frontend

Frontend-dashboard för Telink mötesstatistik, byggt med React, TypeScript och Vite.

Design baserat på Telink's hemsida (telink.se) med moderna, minimalistiska komponenter.

## 🎨 Design System

Dashboarden följer Telink's designsystem:

- **Primärfärg:** `#644ff7` (violett)
- **Accent:** `#00884b` (grön)
- **Typografi:** Poppins font
- **Stil:** Modern, luftig, minimalistisk

## 🚀 Komma igång

### 1. Installera dependencies

```bash
npm install
```

### 2. Konfigurera miljövariabler

Skapa en `.env`-fil (eller kopiera från `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Starta utvecklingsserver

```bash
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173) i din webbläsare.

## 📁 Projektstruktur

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # API-klient för backend-anrop
│   ├── components/
│   │   ├── Button.tsx         # Återanvändbar knapp-komponent
│   │   ├── StatsCard.tsx      # Statistik-kort för perioder
│   │   └── MeetingsTable.tsx  # Tabell med möten
│   ├── pages/
│   │   └── Dashboard.tsx      # Huvudsida med översikt
│   ├── styles/
│   │   └── globals.css        # Telink designsystem (färger, typografi)
│   ├── types/
│   │   └── index.ts           # TypeScript types och interfaces
│   ├── App.tsx                # Root-komponent
│   └── main.tsx               # Entry point
├── .env                       # Miljövariabler (gitignorerad)
├── .env.example               # Mall för miljövariabler
└── vite.config.ts             # Vite-konfiguration
```

## 🧩 Komponenter

### Dashboard
Huvudsida som visar:
- **4 Stats-kort:** Idag, Denna vecka, Denna månad, Totalt
- **Möteslista:** Tabell med alla möten
- **Filter:** Användare, period

### StatsCard
Visar statistik för en period:
- Bokningar, Genomförda, Avbokningar, Ombokningar, No-shows
- Show rate (%), No-show rate (%)
- Genomsnittlig kvalitet (1-5)

### MeetingsTable
Lista med möten:
- Datum, tid, ämne, bokare, ägare, status, kvalitet
- Uppdatera status direkt i tabellen
- Sätt kvalitet (1-5) för genomförda möten

## 🔌 API Integration

Frontend anropar backend-API:t:

- `GET /api/stats/summary?period=...&user_id=...` - Hämta statistik
- `GET /api/meetings?user_id=...&from=...&to=...` - Hämta möten
- `PATCH /api/meetings/:id/status` - Uppdatera mötets status

API-klienten finns i `src/api/client.ts`.

## 🎯 UX/UI Principer

### AnalyticsAgent
- Färgkodning av KPIs (grönt = bra, rött = dåligt)
- Show rate > 80% = grönt
- Insiktstext överst: "Denna vecka: X bokningar..."

### UXAgent
- Tydlig hierarki med stats-kort
- Loading states (skeleton screens)
- Error handling med retry-knappar
- Responsiv design (mobil, tablet, desktop)

### BookingUXAgent
- Minimal friktion för statusuppdatering
- Inline-redigering i tabellen
- Kvalitetsbetyg när status sätts till COMPLETED

## 🛠️ Utveckling

### Tillgängliga kommandon

```bash
npm run dev          # Starta dev-server (port 5173)
npm run build        # Bygga för produktion
npm run preview      # Förhandsgranska production-build
npm run lint         # Kör ESLint
```

### CORS och Proxy

Vite är konfigurerad att proxya `/api`-requests till `http://localhost:3000` för att undvika CORS-problem under utveckling.

## 📊 Features

- ✅ Dashboard med 4 periods-kort (Idag, Vecka, Månad, Totalt)
- ✅ Möteslista med statusuppdatering
- ✅ Kvalitetsbetyg (1-5) för genomförda möten
- ✅ Filter per användare
- ✅ Loading & error states
- ✅ Responsiv design (mobil-first)
- ✅ Telink designsystem (färger, typografi, komponenter)

## 🚢 Deployment

### Build för produktion

```bash
npm run build
```

Detta skapar en optimerad build i `dist/`-mappen.

### Environment variables i production

Se till att sätta `VITE_API_BASE_URL` till din produktions-backend-URL.

## 📝 Nästa steg

- [ ] Lägg till datumfilter för möten
- [ ] Lägg till grafer/charts (t.ex. show rate över tid)
- [ ] Export-funktion (CSV/Excel)
- [ ] Dark mode (om önskat)
- [ ] Notifikationer för låg show rate

## 🤝 Samarbete med Backend

Backend-teamet bygger REST-API:t i `../backend/`. Se till att:
1. Backend körs på port 3000
2. CORS är aktiverat i backend
3. Endpoints matchar API-klienten (`src/api/client.ts`)
