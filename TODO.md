# 📋 TODO - Prioriterad lista

## ✅ KLART (kan testas nu!)

- [x] Next.js projekt med TypeScript, Tailwind, App Router
- [x] Prisma schema för Vercel Postgres
- [x] JWT-autentisering (create, verify)
- [x] Auth middleware för API routes
- [x] Next.js middleware för route protection
- [x] Login API endpoint + logout + me
- [x] Login-sida (frontend)
- [x] Basic Dashboard-sida
- [x] use-auth hook
- [x] Seed-script för testanvändare

**Du kan nu testa login-flödet!** Se README.md

---

## 🔥 PRIORITET 1 - Kritiska API endpoints (behövs för grundfunktionalitet)

### Services (kopiera från backend)
- [ ] `lib/services/meeting-service.ts` - Möteslogik, synk, fuzzy search
- [ ] `lib/services/stats-service.ts` - KPI-beräkningar
- [ ] `lib/services/graph-service.ts` - Microsoft Graph API
- [ ] `lib/services/msal-service.ts` - Microsoft OAuth
- [ ] `lib/utils/ownership.ts` - Meeting ownership filters

### API Routes - Meetings
- [ ] `app/api/meetings/route.ts` - GET (lista möten), POST (skapa möte)
- [ ] `app/api/meetings/[id]/route.ts` - GET, PATCH, DELETE
- [ ] `app/api/meetings/[id]/status/route.ts` - PATCH (uppdatera status)
- [ ] `app/api/meetings/from-link/route.ts` - POST (skapa från Outlook-länk)

### API Routes - Stats
- [ ] `app/api/stats/summary/route.ts` - GET (stats för period)
- [ ] `app/api/stats/detailed/route.ts` - GET (per-user stats)
- [ ] `app/api/stats/trends/route.ts` - GET (trender över tid)
- [ ] `app/api/stats/overview/route.ts` - GET (komplett översikt)

---

## 🎯 PRIORITET 2 - Huvudfunktioner frontend

### UI-komponenter (Tailwind-baserade)
- [ ] `components/ui/button.tsx` - Återanvändbar button
- [ ] `components/ui/card.tsx` - Card-komponent
- [ ] `components/ui/input.tsx` - Input-fält
- [ ] `components/ui/modal.tsx` - Modal dialog
- [ ] `components/ui/table.tsx` - Tabell-komponent

### Stats-komponenter
- [ ] `components/stats/stats-card.tsx` - Statistikkort (från StatsCard.tsx)
- [ ] `components/stats/stats-grid.tsx` - Grid layout för stats

### Meetings-komponenter
- [ ] `components/meetings/meetings-table.tsx` - Mötestabell med actions
- [ ] `components/meetings/status-badge.tsx` - Status-indikator
- [ ] `components/meetings/add-meeting-modal.tsx` - Quick add modal

### Dashboard (fullständig)
- [ ] Uppdatera `dashboard/page.tsx` - Fetch stats server-side
- [ ] Visa alla 4 stats-kort (Idag, Vecka, Månad, Total)
- [ ] Visa senaste mötena
- [ ] User filter chips
- [ ] Sökfunktion för möten

### Meetings List-sida
- [ ] `app/(dashboard)/meetings/page.tsx` - Lista alla möten
- [ ] Filter (status, användare, datum)
- [ ] Sökning (debounced)
- [ ] Statusuppdatering direkt i tabellen

### Meeting Detail-sida
- [ ] `app/(dashboard)/meetings/[id]/page.tsx` - Visa/redigera möte
- [ ] Redigera mötesdetaljer
- [ ] Uppdatera status
- [ ] Ta bort möte

### New Meeting-sida
- [ ] `app/(dashboard)/meetings/new/page.tsx` - Skapa nytt möte
- [ ] Form med alla fält
- [ ] User dropdown (booker/owner)

---

## 🔒 PRIORITET 3 - User management (ADMIN)

### API Routes - Users
- [ ] `app/api/users/route.ts` - GET (lista users), POST (skapa user)
- [ ] `app/api/users/[id]/route.ts` - GET, PATCH, DELETE
- [ ] `app/api/users/invite/route.ts` - POST (skapa invite)

### API Routes - Auth (komplettering)
- [ ] `app/api/auth/invite/complete/route.ts` - POST (acceptera invite)
- [ ] `app/api/auth/microsoft/login/route.ts` - GET (initiera OAuth)
- [ ] `app/api/auth/callback/route.ts` - GET (OAuth callback)
- [ ] `app/api/auth/sync/route.ts` - POST (synka kalender)

### Users-sida (ADMIN only)
- [ ] `app/(dashboard)/users/page.tsx` - Visa alla användare
- [ ] Skapa invite
- [ ] Redigera användare
- [ ] Ta bort användare

### Invite completion-sida
- [ ] `app/(auth)/invite/complete/page.tsx` - Acceptera invite, sätt lösenord

---

## 🎨 PRIORITET 4 - UI Polish

### Layout
- [ ] `app/(dashboard)/layout.tsx` - Dashboard layout med sidebar/nav
- [ ] `components/layout/header.tsx` - Header med user menu
- [ ] `components/layout/sidebar.tsx` - Navigation sidebar

### Styling förbättringar
- [ ] Loading states (skeletons)
- [ ] Error states
- [ ] Success toasts/notifications
- [ ] Responsive design (mobile-friendly)

---

## 🚀 PRIORITET 5 - Microsoft OAuth integration

- [ ] Implementera full Microsoft OAuth flow
- [ ] Testa kalendersynk från Outlook/Teams
- [ ] Uppdatera Azure redirect URI
- [ ] Hantera token refresh

---

## 🧪 PRIORITET 6 - Testing & Optimization

- [ ] Testa alla API endpoints (Postman/curl)
- [ ] Testa auth flow (login, logout, protected routes)
- [ ] Testa role-based access (USER vs ADMIN)
- [ ] Lighthouse performance test
- [ ] Optimera Prisma queries
- [ ] Error handling förbättringar

---

## 📊 Framsteg

**Klart**: 10 uppgifter
**Återstår**: ~45 uppgifter
**Progress**: ~18%

**Estimerad tid**:
- Prioritet 1: 4-6 timmar
- Prioritet 2: 6-8 timmar
- Prioritet 3: 3-4 timmar
- Prioritet 4: 2-3 timmar
- Prioritet 5: 2-3 timmar
- Prioritet 6: 2-3 timmar

**Total**: 19-27 timmar

---

## 🎯 Nästa steg (rekommenderat)

1. **Testa det som finns** - Kör login-flödet enligt README.md
2. **Implementera services** - Kopiera från backend (4 filer)
3. **Skapa meetings API** - CRUD endpoints (4 routes)
4. **Skapa stats API** - Stats endpoints (4 routes)
5. **Bygg Dashboard** - Fullständig med stats och möten
6. **Meetings List** - Visa och filtrera möten

Efter det har du en fungerande app!
