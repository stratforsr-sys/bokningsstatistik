# Deployment Guide - Unified Application

## Översikt

Applikationen är nu **unified** - backend serverar frontend som statiska filer. Allt körs från **EN** server, ingen separat frontend/backend deployment behövs.

## Lokal Utveckling

Starta applikationen:
```bash
cd backend
npm run dev
```

Öppna webbläsaren: **http://localhost:3000**

Backend och frontend körs nu på **samma port (3000)**.

---

## Vercel Deployment (Rekommenderat)

### Steg 1: Skapa Vercel Project

1. Gå till [Vercel Dashboard](https://vercel.com/dashboard)
2. Klicka på **Add New** → **Project**
3. Importera ditt GitHub repository: `stratforsr-sys/bokningsstatistik`

### Steg 2: Konfigurera Build Settings

**VIKTIGT:** Ändra Root Directory till `backend`

**Build & Development Settings:**
- Root Directory: `backend`
- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: (lämna tomt)
- Install Command: `npm install`

### Steg 3: Environment Variables

Lägg till följande environment variables i Vercel (**Settings** → **Environment Variables**):

```
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=<generera-en-säker-nyckel-minst-32-tecken>
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

**För att få en PostgreSQL databas:**
- Använd [Supabase](https://supabase.com) (gratis tier)
- Eller [Neon](https://neon.tech) (gratis tier)
- Eller [Railway](https://railway.app) PostgreSQL
- Kopiera connection string till `DATABASE_URL`

### Steg 4: Deploy

Klicka på **Deploy**. Vercel kommer:
1. Bygga frontend (via `npm run build:frontend`)
2. Bygga backend (via `npm run build:backend`)
3. Deploya backend som serverar frontend

### Steg 5: Kör Database Migrations

Efter första deploy, kör migrations:

1. Gå till ditt Vercel projekt
2. Klicka på **Settings** → **Environment Variables**
3. Kopiera `DATABASE_URL`
4. På din lokala dator, kör:

```bash
cd backend
DATABASE_URL="<din-vercel-database-url>" npx prisma migrate deploy
```

### Steg 6: Skapa Admin-användare

Kör detta lokalt med Vercel database URL:

```bash
cd backend
DATABASE_URL="<din-vercel-database-url>" node create-admin.js
```

---

## Alternativ: Railway Deployment

Railway kan deploya fullstack Node.js apps enkelt:

### Steg 1: Skapa Railway Project

1. Gå till [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Välj `bokningsstatistik`

### Steg 2: Konfigurera Service

**Root Directory:** `backend`

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

### Steg 3: Lägg till PostgreSQL

1. I Railway dashboard, klicka **+ New**
2. Välj **Database** → **PostgreSQL**
3. Railway kopplar automatiskt `DATABASE_URL`

### Steg 4: Environment Variables

Lägg till:
```
JWT_SECRET=<generera-en-säker-nyckel>
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Steg 5: Deploy & Migrations

Railway deployer automatiskt. Kör sedan migrations:

```bash
railway run npx prisma migrate deploy
```

---

## Alternativ: Render.com Deployment

### Steg 1: Skapa Web Service

1. Gå till [Render.com](https://render.com)
2. **New** → **Web Service**
3. Anslut GitHub repo `bokningsstatistik`

### Steg 2: Konfigurera

**Root Directory:** `backend`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### Steg 3: Skapa PostgreSQL Database

1. **New** → **PostgreSQL**
2. Kopiera Internal Database URL
3. Lägg till som environment variable `DATABASE_URL` i Web Service

### Steg 4: Environment Variables

```
DATABASE_URL=<från-postgresql-service>
JWT_SECRET=<generera-säker-nyckel>
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Steg 5: Deploy & Migrations

Efter deploy, öppna Shell i Render dashboard:

```bash
npx prisma migrate deploy
node create-admin.js
```

---

## Checklist

- [ ] Backend + Frontend deployad som EN applikation
- [ ] PostgreSQL databas skapad och ansluten
- [ ] Environment variables konfigurerade (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Database migrations körda (`npx prisma migrate deploy`)
- [ ] Admin-användare skapad (`node create-admin.js`)
- [ ] Test: Öppna deployed URL och logga in

---

## Vanliga Problem

### "Module not found" fel
- Se till att `npm run build` körs korrekt
- Kontrollera att både frontend och backend byggs

### 404-fel på deployed site
- Kontrollera att Root Directory är satt till `backend`
- Verifiera att `frontend/dist` mappen finns efter build

### Database connection error
- Kontrollera `DATABASE_URL` i environment variables
- Se till att databasen accepterar externa anslutningar

### JWT errors
- Sätt `JWT_SECRET` environment variable
- Minst 32 tecken långt

---

## Skillnad mot tidigare struktur

**Tidigare:** Separata deployments
- Frontend på Vercel
- Backend på Render/Railway
- CORS konfiguration mellan två domäner

**Nu:** Unified deployment
- Backend serverar frontend
- EN deployment, EN domän
- Ingen CORS behövs
- Enklare att deploya och underhålla
