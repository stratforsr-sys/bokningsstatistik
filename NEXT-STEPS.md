# ✅ Nästa steg - Deploy till Vercel (DU gör dessa steg)

Jag har förberett allt! Build fungerar och git repo är klart. Nu behöver du bara göra dessa 3 enkla steg:

---

## 📦 STEG 1: Pusha till GitHub (2 minuter)

### 1a. Skapa nytt GitHub repo

1. Gå till [github.com/new](https://github.com/new)
2. Repository name: `telink-nextjs` (eller vad du vill)
3. **Viktigt:** Välj **Private** (för säkerhet)
4. **KRYSSA INTE I** "Initialize with README" (vi har redan filer)
5. Klicka **Create repository**

### 1b. Pusha kod till GitHub

Kopiera kommandona från GitHub (under "…or push an existing repository from the command line"):

```bash
cd C:\Users\zenev\Desktop\telink-nextjs

git remote add origin https://github.com/DITT-USERNAME/telink-nextjs.git
git branch -M main
git push -u origin main
```

**Klart!** Din kod är nu på GitHub.

---

## 🚀 STEG 2: Deploy till Vercel (3 minuter)

### 2a. Importera projektet

1. Gå till [vercel.com/new](https://vercel.com/new)
2. Logga in med GitHub
3. Klicka **"Import Git Repository"**
4. Välj ditt repo: `telink-nextjs`
5. Klicka **Import**

### 2b. Konfigurera projektet

Vercel visar nu import-sidan:

✅ **Framework Preset**: Vercel hittar automatiskt **Next.js**
✅ **Root Directory**: `.` (låt vara som det är)
✅ **Build Command**: `prisma generate && next build` (från vercel.json)
✅ **Output Directory**: `.next` (standard för Next.js)

**Klicka bara "Deploy"** - Vercel börjar bygga!

⏱️ Detta tar ~2 minuter första gången.

### 2c. Vänta på deployment

Du kommer se:
- ⏳ Building... (gul)
- ✅ Ready (grön) när det är klart

**Första deployment kommer FAILA** - det är normalt! Vi saknar databas och environment variables.

---

## 🗄️ STEG 3: Lägg till Vercel Postgres (2 minuter)

### 3a. Skapa databas

1. I Vercel Dashboard → Ditt projekt
2. Gå till **Storage** tab (högst upp)
3. Klicka **Create Database**
4. Välj **Postgres**
5. Välj din region (t.ex. **Frankfurt** om du är i Europa)
6. Database Name: `telink-db` (eller standard)
7. Klicka **Create**

### 3b. Koppla till projektet

1. Efter databas skapats, klicka **Connect to Project**
2. Välj ditt projekt: `telink-nextjs`
3. Klicka **Connect**

Vercel sätter automatiskt alla `POSTGRES_*` environment variables! ✅

---

## 🔑 STEG 4: Lägg till JWT_SECRET (1 minut)

### 4a. Generera säkert JWT_SECRET

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

Kopiera output (t.ex. `xK9mP2vN8qR5tY7wA3bC6dE1fG4hJ0lM`)

### 4b. Lägg till i Vercel

1. Vercel Dashboard → Ditt projekt
2. Gå till **Settings** → **Environment Variables**
3. Klicka **Add New**
4. Name: `JWT_SECRET`
5. Value: *klistra in ditt genererade värde*
6. Environments: Kryssa i **Production**, **Preview**, **Development**
7. Klicka **Save**

### 4c. Lägg till JWT_EXPIRES_IN

Klicka **Add New** igen:
- Name: `JWT_EXPIRES_IN`
- Value: `7d`
- Environments: Alla tre
- Klicka **Save**

---

## 🔄 STEG 5: Redeploy (30 sekunder)

Nu när databas och env vars finns:

1. Gå till **Deployments** tab
2. Klicka på senaste deployment (troligen "Failed")
3. Klicka **⋮** (tre prickar) → **Redeploy**
4. Bekräfta

Vänta ~2 minuter...

✅ **När det står "Ready"** - din app är live!

---

## 🗃️ STEG 6: Seed databasen (2 minuter)

Din app är nu deployad, men databasen är tom. Skapa testanvändare:

### 6a. Installera Vercel CLI

```bash
npm i -g vercel
```

### 6b. Logga in och länka projekt

```bash
cd C:\Users\zenev\Desktop\telink-nextjs

vercel login
# Följ instruktioner (klicka på länk i terminal)

vercel link
# Välj ditt projekt när det frågar
```

### 6c. Hämta environment variables

```bash
vercel env pull .env.local
```

Detta laddar ner alla Vercel Postgres connection strings till din lokala maskin.

### 6d. Kör migrations och seed

```bash
npx prisma migrate deploy
npm run seed
```

Du borde se:
```
✅ Admin user created: admin@telink.se
✅ Regular user created: user@telink.se

🎉 Seeding completed!

📝 Test accounts:
  Admin: admin@telink.se / admin123
  User:  user@telink.se / user123
```

---

## 🎉 STEG 7: TESTA DIN APP!

1. Öppna din Vercel URL (hittar du i Dashboard)
   - Exempel: `https://telink-nextjs-abc123.vercel.app`

2. Du borde redirectas till `/login`

3. Logga in med:
   - Email: `admin@telink.se`
   - Lösenord: `admin123`

4. Du borde se Dashboard med din användarinfo! 🎊

---

## ❌ Om något går fel

### Problem: "404 Not Found"

**Lösning:**
- Gå till Settings → General → Framework Preset
- Kontrollera att det står **Next.js** (inte "Other")
- Om fel: Ändra till Next.js och redeploy

### Problem: "500 Internal Server Error"

**Orsaker:**
1. Databas inte kopplad → Gå tillbaka till Steg 3
2. JWT_SECRET saknas → Gå tillbaka till Steg 4
3. Prisma migration inte körd → Kör `npx prisma migrate deploy`

**Felsök:**
- Vercel Dashboard → Deployments → Klicka på deployment
- Gå till **Function Logs** tab
- Leta efter röda error-meddelanden

### Problem: "Can't reach database"

**Lösning:**
```bash
# Kör detta igen:
vercel env pull .env.local
npx prisma migrate deploy
```

---

## 📊 Sammanfattning av vad jag gjorde åt dig

✅ Skapade Next.js-projekt med TypeScript + Tailwind
✅ Implementerade JWT-autentisering (login, logout, me)
✅ Skapade Login-sida och Dashboard
✅ Konfigurerade Prisma för Vercel Postgres
✅ Fixade build-fel (TypeScript)
✅ Skapade vercel.json för korrekt deployment
✅ Initierade git repo och gjorde commit
✅ Skapade seed-script för testanvändare
✅ Verifierade att build fungerar (✅ Success!)

**Du behöver bara:**
1. Pusha till GitHub (1 kommando)
2. Importera till Vercel (3 klick)
3. Lägg till databas (3 klick)
4. Lägg till JWT_SECRET (2 klick)
5. Redeploy (1 klick)
6. Seed databas (2 kommandon)

**Total tid: ~10 minuter**

---

## 🚀 Efter deployment

När din app fungerar:

1. **Läs TODO.md** - Se vad som återstår (45 uppgifter)
2. **Läs DEPLOY.md** - Avancerade deployment-tips
3. **Fortsätt bygga** - Implementera Meetings API, Stats, etc.

---

Lycka till! 🎉
