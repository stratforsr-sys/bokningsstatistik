# 🚀 Deployment Guide - Vercel

## Snabbguide (5 minuter)

### 1. Förbered projektet

```bash
cd C:\Users\zenev\Desktop\telink-nextjs

# Kontrollera att build fungerar
npm run build

# Skapa git repo om det inte finns
git init
git add .
git commit -m "Initial commit - Next.js migration"
```

### 2. Pusha till GitHub

```bash
# Skapa ett nytt GitHub repo (via GitHub webbsida)
# Sedan:
git remote add origin https://github.com/ditt-username/telink-nextjs.git
git branch -M main
git push -u origin main
```

### 3. Koppla till Vercel

1. Gå till [vercel.com](https://vercel.com)
2. Logga in med GitHub
3. Klicka "Add New Project"
4. Välj ditt GitHub repo (telink-nextjs)
5. **Framework Preset**: Vercel identifierar automatiskt **Next.js** ✅
6. Klicka **Deploy**

### 4. Lägg till Vercel Postgres

1. I Vercel Dashboard → Din projekt
2. Gå till **Storage** tab
3. Klicka **Create Database**
4. Välj **Postgres**
5. Välj region (närmast dig)
6. Klicka **Create**
7. Koppla till ditt projekt

Vercel sätter automatiskt dessa environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 5. Lägg till Environment Variables

Gå till **Settings** → **Environment Variables** och lägg till:

**KRITISKT (måste läggas till):**

```
JWT_SECRET = din-super-hemliga-nyckel-minst-32-tecken-long
```
Generera ett säkert värde:
```bash
# Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Mac/Linux:
openssl rand -base64 32
```

**VALFRITT (för Microsoft OAuth):**
```
JWT_EXPIRES_IN = 7d
AZURE_CLIENT_ID = your-client-id
AZURE_TENANT_ID = your-tenant-id
AZURE_CLIENT_SECRET = your-client-secret
AZURE_REDIRECT_URI = https://din-domain.vercel.app/api/auth/callback
```

**Tips:** Sätt variables för **Production**, **Preview** och **Development**

### 6. Kör migrations på Vercel Postgres

Från din lokala dator (connected till Vercel Postgres):

```bash
# Installera Vercel CLI om du inte har det
npm i -g vercel

# Logga in
vercel login

# Länka till projektet
vercel link

# Hämta environment variables
vercel env pull .env.local

# Kör migrations
npx prisma migrate deploy

# Seed databasen
npm run seed
```

### 7. Testa deployment

1. Gå till din Vercel URL: `https://ditt-projekt.vercel.app`
2. Du ska redirectas till `/login`
3. Logga in med: `admin@telink.se` / `admin123`
4. Du ska se Dashboard

---

## Felsökning

### Problem: "404 Not Found"

**Lösning 1: Kontrollera Framework Preset**
- Gå till Vercel → Settings → General
- Framework Preset ska vara **Next.js**
- Om det står "Other", ändra till "Next.js" och redeploya

**Lösning 2: Kontrollera Build Command**
- Gå till Vercel → Settings → General → Build & Development Settings
- Build Command: `prisma generate && next build`
- Output Directory: `.next`
- Install Command: `npm install`

**Lösning 3: Kontrollera Build Logs**
- Gå till Vercel → Deployments → Senaste deployment
- Klicka på "Building" eller "Logs"
- Leta efter fel i build-processen

### Problem: "Internal Server Error" (500)

**Orsak:** Saknade environment variables eller databas-connection error

**Lösning:**
1. Kontrollera att alla environment variables är satta
2. Kontrollera Vercel Postgres-connection
3. Se Function Logs i Vercel Dashboard

### Problem: Build failar pga Prisma

**Lösning:**
```bash
# Lägg till postinstall script i package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Problem: "Error: P1001 Can't reach database server"

**Orsak:** Vercel Postgres inte kopplad eller fel connection string

**Lösning:**
1. Kontrollera att Vercel Postgres är kopplad till projektet
2. Verifiera att `POSTGRES_PRISMA_URL` finns i Environment Variables
3. Redeploya efter att ha kopplat databasen

---

## Automatisk deployment

Varje push till `main` branch deployas automatiskt till production.

För preview deployments:
```bash
git checkout -b feature/ny-funktion
git add .
git commit -m "Add feature"
git push origin feature/ny-funktion
```

Skapa Pull Request på GitHub → Vercel skapar automatiskt en preview deployment.

---

## Uppdatera Deployment

```bash
# Gör ändringar i koden
git add .
git commit -m "Update: beskrivning"
git push origin main
```

Vercel rebuildar och deployer automatiskt.

---

## Avancerat: Custom Domain

1. Vercel Dashboard → Settings → Domains
2. Lägg till din domain
3. Uppdatera DNS-records enligt Vercels instruktioner
4. Vänta på SSL-certifikat (tar ~1 minut)

---

## Troubleshooting Checklist

- [ ] Framework preset är **Next.js**
- [ ] Build command: `prisma generate && next build`
- [ ] Output directory: `.next`
- [ ] Vercel Postgres är kopplad
- [ ] `JWT_SECRET` är satt i Environment Variables
- [ ] Prisma migrations är körda (`prisma migrate deploy`)
- [ ] Seed-script är kört (`npm run seed`)
- [ ] Build logs visar ingen error
- [ ] Function logs (runtime) visar ingen error

---

## Nästa steg efter deployment

1. Testa login på production URL
2. Skapa riktiga användare (inte bara test-accounts)
3. Uppdatera `AZURE_REDIRECT_URI` i Azure Portal (om du använder Microsoft OAuth)
4. Implementera resten av funktionalitet enligt TODO.md
