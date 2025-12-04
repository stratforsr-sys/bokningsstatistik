# Deployment Guide

## Vercel Deployment (Frontend)

### Steg 1: Konfigurera Vercel Project

1. Gå till ditt projekt på Vercel
2. Gå till **Settings** → **General**
3. Ändra följande inställningar:

**Root Directory:**
```
frontend
```

**Build & Development Settings:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Steg 2: Konfigurera Environment Variables

Gå till **Settings** → **Environment Variables** och lägg till:

```
VITE_API_BASE_URL=https://your-backend-domain.com
```

### Steg 3: Deploy

Klicka på **Deploy** eller vänta på automatisk deploy vid nästa git push.

---

## Backend Deployment Options

### Option 1: Render.com (Rekommenderat för Node.js + PostgreSQL)

1. Skapa ett konto på [Render.com](https://render.com)
2. Skapa en **Web Service**:
   - Repository: `stratforsr-sys/bokningsstatistik`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
   - Environment: `Node`

3. Skapa en **PostgreSQL Database**:
   - Kopiera connection string

4. Lägg till Environment Variables:
   ```
   DATABASE_URL=<din-postgresql-url>
   JWT_SECRET=<generera-en-säker-nyckel>
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://din-vercel-domain.vercel.app
   NODE_ENV=production
   PORT=3000
   ```

5. Efter deploy, kör migrations:
   - Gå till Shell i Render dashboard
   - Kör: `npx prisma migrate deploy`

### Option 2: Railway.app

1. Skapa konto på [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Välj `bokningsstatistik`
4. Lägg till PostgreSQL:
   - Click **+ New** → **Database** → **Add PostgreSQL**
5. Konfigurera backend service:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
6. Lägg till Environment Variables (samma som ovan)
7. Deploy och kör migrations via Railway CLI eller dashboard

### Option 3: Fly.io

Se dokumentation: https://fly.io/docs/languages-and-frameworks/node/

---

## Skapa Admin-användare

Efter backend är deployed, kör detta för att skapa första admin:

**Via Render/Railway Shell:**
```bash
node create-admin.js
```

**Eller via API (efter deploy):**
```bash
curl -X POST https://your-backend.com/api/users/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "role": "ADMIN"
  }'
```

---

## Vercel Frontend URL Update

Efter att backend är deployed:

1. Uppdatera environment variable i Vercel:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```
2. Redeploy frontend

---

## Checklist

- [ ] Backend deployed på Render/Railway/Fly.io
- [ ] PostgreSQL databas skapad och ansluten
- [ ] Environment variables konfigurerade
- [ ] Database migrations körda (`npx prisma migrate deploy`)
- [ ] Admin-användare skapad
- [ ] Frontend deployed på Vercel
- [ ] Frontend pekar på rätt backend URL
- [ ] CORS konfigurerat på backend för frontend domain
- [ ] Test: Logga in på frontend med admin-användare
