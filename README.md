# Telink Mötesstatistik - Next.js

Modern Next.js-app för bokningsstatistik och möteshantering.

## 🚀 Snabbstart (Lokal utveckling)

### 1. Installera dependencies
```bash
npm install
```

### 2. Konfigurera miljövariabler
Kopiera `.env.example` till `.env.local`:
```bash
cp .env.example .env.local
```

Uppdatera `.env.local` med dina värden:
```env
# För lokal PostgreSQL:
DATABASE_URL="postgresql://user:password@localhost:5432/telink_meetings"
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/telink_meetings"
POSTGRES_URL_NON_POOLING="postgresql://user:password@localhost:5432/telink_meetings"

# JWT (VIKTIGT: Använd ett säkert värde i produktion!)
JWT_SECRET="din-super-hemliga-nyckel-minst-32-tecken-long"
JWT_EXPIRES_IN="7d"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Kör Prisma migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed databasen med testanvändare
```bash
npx tsx prisma/seed.ts
```

Detta skapar två testanvändare:
- **Admin**: `admin@telink.se` / `admin123`
- **User**: `user@telink.se` / `user123`

### 5. Starta utvecklingsservern
```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## 🧪 Testa login-flödet

1. Gå till `http://localhost:3000`
2. Du redirectas till `/login`
3. Logga in med:
   - Email: `admin@telink.se`
   - Lösenord: `admin123`
4. Du redirectas till `/dashboard`
5. Du ser din användarinfo och kan logga ut

## 📦 Vercel Deployment

### 1. Skapa Vercel-projekt
```bash
vercel login
vercel link
```

### 2. Lägg till Vercel Postgres
- Gå till Vercel Dashboard → Storage → Create Database → Postgres
- Koppla till ditt projekt
- Vercel populerar automatiskt `POSTGRES_*` environment variables

### 3. Lägg till environment variables i Vercel
Dashboard → Settings → Environment Variables:
- `JWT_SECRET` - Ett slumpmässigt, säkert värde (minst 32 tecken)
- `JWT_EXPIRES_IN` - `7d`
- `AZURE_CLIENT_ID` - (om du använder Microsoft OAuth)
- `AZURE_TENANT_ID` - (om du använder Microsoft OAuth)
- `AZURE_CLIENT_SECRET` - (om du använder Microsoft OAuth)
- `AZURE_REDIRECT_URI` - `https://din-domain.vercel.app/api/auth/callback`

### 4. Kör migrations på Vercel Postgres
Från din lokala maskin (connected till Vercel Postgres):
```bash
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts
```

### 5. Deploy
```bash
git push origin main
```
Vercel deployer automatiskt.

## 📁 Projektstruktur

```
telink-nextjs/
├── app/
│   ├── (auth)/
│   │   └── login/              # Login-sida
│   ├── (dashboard)/
│   │   └── dashboard/          # Dashboard-sida
│   ├── api/
│   │   └── auth/
│   │       ├── login/          # POST /api/auth/login
│   │       ├── logout/         # POST /api/auth/logout
│   │       └── me/             # GET /api/auth/me
│   ├── layout.tsx              # Root layout med Poppins font
│   └── globals.css             # Tailwind + custom styles
├── lib/
│   ├── db.ts                   # Prisma client
│   ├── auth/
│   │   ├── jwt.ts             # JWT create/verify
│   │   ├── middleware.ts      # API route auth
│   │   └── session.ts         # Server Component auth
│   └── hooks/
│       └── use-auth.ts        # Client-side auth hook
├── components/                 # (kommer snart)
├── types/
│   └── index.ts               # TypeScript types
├── prisma/
│   ├── schema.prisma          # Databas-schema
│   └── seed.ts                # Seed-script
└── middleware.ts              # Next.js route protection
```

## 🔑 Autentisering

Appen använder JWT-tokens lagrade i HttpOnly cookies för säker autentisering.

- **Login**: POST `/api/auth/login` med email/password
- **Logout**: POST `/api/auth/logout`
- **Current User**: GET `/api/auth/me`
- **Route Protection**: Next.js middleware redirectar oautentiserade användare till `/login`

## 🎨 Styling

- **Tailwind CSS** med custom Telink-färger:
  - `telink-violet`: #644ff7 (primär)
  - `telink-violet-light`: #8c7cff
  - `telink-violet-dark`: #4a38d6
- **Font**: Poppins (Google Fonts)
- **Custom Components**: Se `app/globals.css` för `.card`, `.stats-card`, etc.

## 🛠️ Teknisk Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: JWT (jsonwebtoken)
- **State Management**: SWR
- **Password Hashing**: bcrypt

## 📝 Nästa steg

Se `TODO.md` för en prioriterad lista över vad som återstår att implementera.
