# Telink Boknings-statistik Backend

Backend-system för mötesstatistik med Outlook/Teams-integration via Microsoft Graph API.

## 📋 Innehållsförteckning

- [Översikt](#översikt)
- [Tech Stack](#tech-stack)
- [Funktioner](#funktioner)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Databasmigrering](#databasmigrering)
- [Användning](#användning)
- [API Endpoints](#api-endpoints)
- [Azure AD Setup](#azure-ad-setup)

---

## Översikt

Detta backend-system hanterar:

1. **OAuth-integration** med Microsoft Graph API för att hämta möten från Outlook/Teams
2. **Automatisk synkronisering** av kalender-events
3. **Mötesstatushantering** (bokad, genomförd, no-show, avbokad, ombokad)
4. **Kvalitetspoäng** (1-5) för genomförda möten
5. **Statistikmotor** som beräknar KPI:er per person och tidsperiod
6. **REST API** för frontend och eventuella andra klienter

---

## Tech Stack

- **Runtime**: Node.js med TypeScript
- **Framework**: Express.js
- **Databas**: PostgreSQL
- **ORM**: Prisma
- **Integration**: Microsoft Graph API
- **Auth**: OAuth 2.0 (Azure AD)

---

## Funktioner

### Möteshantering

- Hämta möten från Outlook via login
- Klistra in Outlook/Teams-länk för att lägga till möte
- Uppdatera mötesstatus och kvalitet
- Automatisk synkronisering av kalender-events

### Statusar

- `BOOKED` - Mötet är bokat
- `COMPLETED` - Mötet genomfördes
- `NO_SHOW` - Kunden dök inte upp
- `CANCELED` - Mötet avbokades
- `RESCHEDULED` - Mötet ombokades

### Statistik (KPI:er)

- Bokningar per dag/vecka/månad/totalt
- Genomförda möten
- No-shows och show rate
- Avbokningar och ombokningar
- Genomsnittlig kvalitetspoäng
- Trendanalys över tid

---

## Installation

### 1. Förutsättningar

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm eller yarn

### 2. Installera dependencies

```bash
cd backend
npm install
```

---

## Konfiguration

### 1. Skapa .env-fil

Kopiera `.env.example` till `.env`:

```bash
cp .env.example .env
```

### 2. Konfigurera miljövariabler

Redigera `.env` och fyll i följande:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/telink_meetings?schema=public"

# Server
PORT=3000
NODE_ENV=development

# Microsoft Azure AD (se Azure AD Setup-sektion)
AZURE_CLIENT_ID="din-client-id"
AZURE_TENANT_ID="din-tenant-id"
AZURE_CLIENT_SECRET="din-client-secret"
AZURE_REDIRECT_URI="http://localhost:3000/auth/callback"

# Session secret (generera en stark slumpmässig sträng)
SESSION_SECRET="din-hemliga-nyckel-här"
```

### 3. Sätt upp PostgreSQL

Skapa en databas:

```bash
# Logga in i PostgreSQL
psql -U postgres

# Skapa databas
CREATE DATABASE telink_meetings;

# Skapa användare (valfritt)
CREATE USER telink_user WITH PASSWORD 'ditt_lösenord';
GRANT ALL PRIVILEGES ON DATABASE telink_meetings TO telink_user;
```

---

## Databasmigrering

### 1. Generera Prisma Client

```bash
npm run prisma:generate
```

### 2. Kör migrations

```bash
npm run prisma:migrate
```

Detta skapar alla tabeller enligt Prisma-schemat.

### 3. (Valfritt) Öppna Prisma Studio

För att utforska databasen visuellt:

```bash
npm run prisma:studio
```

---

## Användning

### Starta servern (development)

```bash
npm run dev
```

Servern körs nu på `http://localhost:3000`

### Starta servern (production)

```bash
npm run build
npm start
```

---

## API Endpoints

### Health Check

```
GET /health
```

Returnerar serverstatus.

### Root

```
GET /
```

Returnerar API-information och tillgängliga endpoints.

---

### Auth Endpoints

#### 1. Inloggning (OAuth)

```
GET /auth/login
```

Redirectar användaren till Microsoft-inloggning.

#### 2. OAuth Callback

```
GET /auth/callback?code=...
```

Tar emot authorization code och byter till access token. Sparar token och användarinfo i databasen.

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "Användarnamn",
    "email": "user@example.com",
    "role": "BOOKER"
  },
  "accessToken": "..."
}
```

#### 3. Synkronisera möten

```
POST /auth/sync
Content-Type: application/json

{
  "userId": "user-uuid",
  "startDate": "2025-01-01T00:00:00Z", // Valfritt
  "endDate": "2025-12-31T23:59:59Z",   // Valfritt
  "limit": 50                           // Valfritt
}
```

Hämtar möten från Outlook och synkroniserar till databasen.

**Response:**

```json
{
  "success": true,
  "message": "Meetings synced successfully",
  "events": 25,
  "syncResult": {
    "created": 20,
    "updated": 3,
    "skipped": 2
  }
}
```

#### 4. Hämta användarinfo

```
GET /auth/me?userId=uuid
```

---

### Meetings Endpoints

#### 1. Hämta alla möten

```
GET /api/meetings
```

**Query Parameters:**

- `userId` (optional) - Filtrera på bokare eller ägare
- `status` (optional) - Filtrera på status (BOOKED, COMPLETED, etc.)
- `startDate` (optional) - Från-datum
- `endDate` (optional) - Till-datum
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Exempel:**

```
GET /api/meetings?userId=abc123&status=COMPLETED&limit=50
```

**Response:**

```json
{
  "success": true,
  "count": 50,
  "meetings": [
    {
      "id": "uuid",
      "outlookEventId": "AAMk...",
      "bookingDate": "2025-01-15T10:00:00Z",
      "startTime": "2025-01-20T14:00:00Z",
      "endTime": "2025-01-20T15:00:00Z",
      "subject": "Demo med kund X",
      "organizerEmail": "säljare@företag.se",
      "status": "COMPLETED",
      "qualityScore": 4,
      "booker": {
        "id": "uuid",
        "name": "Bokare Namn",
        "email": "bokare@företag.se",
        "role": "BOOKER"
      },
      "owner": {
        "id": "uuid",
        "name": "Säljare Namn",
        "email": "säljare@företag.se",
        "role": "SALES"
      }
    }
  ]
}
```

#### 2. Hämta specifikt möte

```
GET /api/meetings/:id
```

#### 3. Uppdatera mötesstatus

```
PATCH /api/meetings/:id/status
Content-Type: application/json

{
  "status": "COMPLETED",
  "statusReason": "MET_WITH_DECISION_MAKER",
  "qualityScore": 5,
  "notes": "Mycket bra möte, tydligt behov"
}
```

**Möjliga statusReason:**

- Completed: `MET_WITH_DECISION_MAKER`, `MET_WITH_STAKEHOLDER`, `PRODUCTIVE_MEETING`
- No-show: `CLIENT_NO_SHOW`, `CLIENT_FORGOT`
- Canceled: `NOT_INTERESTED`, `WRONG_CONTACT`, `TIMING_NOT_RIGHT`, `BUDGET_CONSTRAINTS`
- Rescheduled: `RESCHEDULED_BY_CLIENT`, `RESCHEDULED_BY_US`, `TECHNICAL_ISSUE`, `CONFLICT_IN_CALENDAR`
- General: `OTHER`

#### 4. Skapa möte från länk

```
POST /api/meetings/from-link
Content-Type: application/json

{
  "link": "https://outlook.office365.com/calendar/item/AAMk...",
  "userId": "user-uuid",
  "ownerId": "owner-uuid"  // Valfritt, default är userId
}
```

Parsar en Outlook/Teams-länk och hämtar mötesinformation via Graph API, sedan skapar mötet i databasen.

**Response:**

```json
{
  "success": true,
  "message": "Meeting created from link",
  "meeting": { ... },
  "action": "created"
}
```

#### 5. Ta bort möte

```
DELETE /api/meetings/:id?hardDelete=false
```

- `hardDelete=false` (default): Soft delete - sätter status till CANCELED
- `hardDelete=true`: Permanent borttagning

---

### Stats Endpoints

#### 1. Sammanfattande statistik

```
GET /api/stats/summary
```

**Query Parameters:**

- `userId` (optional) - Statistik för specifik användare
- `period` - Tidsperiod: `today`, `week`, `month`, `total` (default: month)
- `startDate` (optional) - Custom start-datum
- `endDate` (optional) - Custom slut-datum

**Exempel:**

```
GET /api/stats/summary?userId=abc123&period=month
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "period": "month",
    "user_id": "abc123",
    "dagens_bokningar": 2,
    "veckans_bokningar": 8,
    "manadens_bokningar": 35,
    "total_bokningar": 412,
    "avbokningar": 4,
    "ombokningar": 3,
    "noshows": 2,
    "genomforda": 26,
    "show_rate": 0.93,
    "no_show_rate": 0.07,
    "kvalitet_genomsnitt": 4.2
  }
}
```

#### 2. Detaljerad statistik per användare

```
GET /api/stats/detailed
```

**Query Parameters:**

- `userIds` (optional) - Kommaseparerad lista: `user1,user2,user3`
- `startDate` (optional)
- `endDate` (optional)

**Response:**

```json
{
  "success": true,
  "count": 3,
  "stats": [
    {
      "userId": "user1",
      "userName": "Bokare 1",
      "stats": { ... }
    },
    {
      "userId": "user2",
      "userName": "Bokare 2",
      "stats": { ... }
    }
  ]
}
```

#### 3. Trendanalys

```
GET /api/stats/trends?userId=abc123&days=30
```

**Query Parameters:**

- `userId` (optional)
- `days` (optional, default: 30, max: 365)

**Response:**

```json
{
  "success": true,
  "count": 30,
  "trends": [
    {
      "date": "2025-01-01",
      "bokningar": 5,
      "genomforda": 4,
      "noshows": 1
    },
    ...
  ]
}
```

#### 4. Komplett översikt

```
GET /api/stats/overview?userId=abc123
```

Returnerar statistik för alla perioder (idag, vecka, månad, totalt) samt trenddata i ett enda anrop.

---

## Azure AD Setup

För att kunna använda Microsoft Graph API behöver du registrera en app i Azure AD.

### Steg-för-steg

1. **Gå till Azure Portal**

   - https://portal.azure.com
   - Logga in med ditt Microsoft-konto

2. **Registrera en ny app**

   - Navigera till **Azure Active Directory** → **App registrations** → **New registration**
   - Namn: `Telink Boknings-statistik`
   - Supported account types: `Accounts in this organizational directory only` (single tenant)
   - Redirect URI:
     - Platform: **Web**
     - URI: `http://localhost:3000/auth/callback` (för development)

3. **Kopiera credentials**

   - **Application (client) ID** → Detta är din `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → Detta är din `AZURE_TENANT_ID`

4. **Skapa Client Secret**

   - Gå till **Certificates & secrets** → **New client secret**
   - Description: `Backend Secret`
   - Expires: Välj lämplig tid (rekommenderat: 24 månader)
   - Kopiera **Value** → Detta är din `AZURE_CLIENT_SECRET` (visas endast en gång!)

5. **Konfigurera API Permissions**

   - Gå till **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   - Lägg till:
     - `Calendars.Read`
     - `User.Read`
     - `OnlineMeetings.Read` (valfritt, för Teams-möten)
   - Klicka **Add permissions**
   - Klicka **Grant admin consent for [din organisation]** (om du har admin-rättigheter)

6. **Uppdatera .env-filen**

   Fyll i värdena du kopierade:

   ```env
   AZURE_CLIENT_ID="din-client-id-från-steg-3"
   AZURE_TENANT_ID="din-tenant-id-från-steg-3"
   AZURE_CLIENT_SECRET="din-client-secret-från-steg-4"
   AZURE_REDIRECT_URI="http://localhost:3000/auth/callback"
   ```

7. **Testa inloggningen**

   Starta servern och gå till:

   ```
   http://localhost:3000/auth/login
   ```

   Du ska redirectas till Microsoft-inloggning.

---

## Datamodell

### User

- `id` (UUID, primary key)
- `name` (string)
- `email` (string, unique)
- `role` (enum: BOOKER, SALES, ADMIN)
- `createdAt`, `updatedAt`

### UserToken

- `id` (UUID)
- `userId` (foreign key → User)
- `accessToken` (text)
- `refreshToken` (text, nullable)
- `expiresAt` (timestamp)
- `createdAt`, `updatedAt`

### Meeting

- `id` (UUID, primary key)
- `outlookEventId` (string, unique, nullable)
- `bookingDate` (timestamp) - När mötet bokades
- `startTime`, `endTime` (timestamp) - Mötestider
- `subject` (string)
- `organizerEmail` (string)
- `attendees` (JSON text)
- `joinUrl` (text)
- `bodyPreview` (text)
- `bookerId` (foreign key → User)
- `ownerId` (foreign key → User)
- `status` (enum: BOOKED, COMPLETED, NO_SHOW, CANCELED, RESCHEDULED)
- `statusReason` (enum, nullable)
- `qualityScore` (int 1-5, nullable)
- `notes` (text)
- `createdAt`, `lastUpdated`

---

## Nästa steg

### Backend (Förbättringar)

- [ ] Implementera session-hantering (JWT eller cookie-based)
- [ ] Lägg till autentisering/authorization middleware för API-routes
- [ ] Implementera rate limiting
- [ ] Lägg till input-validering (t.ex. med Zod eller Joi)
- [ ] Förbättra felhantering och logging
- [ ] Lägg till enhetstester
- [ ] Implementera Webhook för att lyssna på kalenderändringar i realtid

### Frontend

- [ ] Bygg React/Vue-dashboard
- [ ] Visa statistik med grafer (Chart.js, Recharts)
- [ ] Implementera användargränssnitt för statusuppdateringar
- [ ] Lägg till filter och sökning

### Deployment

- [ ] Dockerisera backend
- [ ] Sätt upp CI/CD
- [ ] Deploy till Azure/AWS/DigitalOcean
- [ ] Konfigurera production-databas
- [ ] Uppdatera Azure AD redirect URI för production

---

## Licens

Proprietär - Telink AB

---

## Kontakt

För frågor eller support, kontakta utvecklingsteamet.
