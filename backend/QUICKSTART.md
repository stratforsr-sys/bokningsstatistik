# Snabbstartsguide - Telink Boknings-statistik Backend

Denna guide hjälper dig att komma igång snabbt med backend-systemet.

## ⚡ Snabbstart (5 minuter)

### Steg 1: Förberedelser

```bash
cd backend
npm install
```

### Steg 2: Databas (PostgreSQL)

**Alternativ A: Lokal PostgreSQL**

```bash
# Skapa databas
createdb telink_meetings

# Eller via psql
psql -U postgres -c "CREATE DATABASE telink_meetings;"
```

**Alternativ B: Docker (rekommenderat för development)**

```bash
docker run --name telink-postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=telink_meetings \
  -p 5432:5432 \
  -d postgres:14
```

### Steg 3: Konfigurera .env

Kopiera `.env.example` och uppdatera:

```bash
cp .env.example .env
```

**Minimal konfiguration för att komma igång:**

```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/telink_meetings?schema=public"
PORT=3000
NODE_ENV=development

# Azure AD (behöver konfigureras senare för OAuth)
AZURE_CLIENT_ID="dummy-value-for-now"
AZURE_TENANT_ID="dummy-value-for-now"
AZURE_CLIENT_SECRET="dummy-value-for-now"
AZURE_REDIRECT_URI="http://localhost:3000/auth/callback"

SESSION_SECRET="random-secret-key-123"
```

### Steg 4: Kör migrations

```bash
npm run prisma:migrate
```

Vid första körningen, ge migrationen ett namn (t.ex. "init"):

```
Enter a name for the new migration: › init
```

### Steg 5: Starta servern

```bash
npm run dev
```

Du bör se:

```
✅ Databasanslutning lyckades
🚀 Server startad!
📡 Lyssnar på http://localhost:3000
🌍 Miljö: development
```

### Steg 6: Testa API:et

Öppna webbläsaren eller använd curl:

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000
```

---

## 📝 Nästa steg: Konfigurera Azure AD

För att kunna använda Outlook/Teams-integrationen behöver du konfigurera Azure AD:

1. Följ instruktionerna i [README.md - Azure AD Setup](README.md#azure-ad-setup)
2. Uppdatera `.env` med riktiga Azure-credentials
3. Starta om servern

---

## 🧪 Testa funktionalitet utan Azure AD

Om du vill testa backend-funktionaliteten innan Azure AD är konfigurerat:

### 1. Skapa testanvändare manuellt

Öppna Prisma Studio:

```bash
npm run prisma:studio
```

Navigera till `User`-tabellen och skapa en användare:

- **name**: Test Bokare
- **email**: test@example.com
- **role**: BOOKER

Kopiera användarens `id` (UUID).

### 2. Skapa testmöte via databasen

I Prisma Studio, navigera till `Meeting`-tabellen och skapa ett möte:

- **bookingDate**: Dagens datum
- **startTime**: Framtida datum/tid
- **endTime**: Framtida datum/tid (efter startTime)
- **organizerEmail**: test@example.com
- **bookerId**: UUID från steg 1
- **ownerId**: Samma UUID
- **status**: BOOKED

### 3. Testa statistik-API

```bash
# Hämta statistik för användaren
curl "http://localhost:3000/api/stats/summary?period=month"

# Med specifik userId
curl "http://localhost:3000/api/stats/summary?userId=DIN-USER-UUID&period=month"
```

### 4. Testa uppdatera mötesstatus

```bash
curl -X PATCH http://localhost:3000/api/meetings/MÖTES-UUID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "statusReason": "MET_WITH_DECISION_MAKER",
    "qualityScore": 5,
    "notes": "Fantastiskt möte!"
  }'
```

---

## 🔧 Vanliga problem

### Problem: "Connection refused" till PostgreSQL

**Lösning:**

- Kontrollera att PostgreSQL körs: `pg_isready` eller `docker ps`
- Verifiera DATABASE_URL i `.env`
- Testa anslutning: `psql postgresql://postgres:password123@localhost:5432/telink_meetings`

### Problem: Prisma migrations misslyckas

**Lösning:**

```bash
# Återställ databasen (OBS: raderar all data!)
npm run prisma:migrate reset

# Eller skapa om migrationen
npx prisma migrate dev --name init
```

### Problem: "Module not found" fel

**Lösning:**

```bash
# Rensa och återinstallera
rm -rf node_modules package-lock.json
npm install
```

### Problem: TypeScript-kompileringsfel

**Lösning:**

```bash
# Generera Prisma-klient igen
npm run prisma:generate

# Bygg projektet
npm run build
```

---

## 📊 API-testfiler

För att testa API:et med verktyg som Postman eller Insomnia, se:

- [API-exempel](./API_EXAMPLES.md)
- [Postman Collection](./postman_collection.json) (kommande)

---

## 🎯 Utvärdera funktionalitet

Här är några saker du kan testa:

- [ ] Skapa användare via Prisma Studio
- [ ] Skapa testmöte via Prisma Studio
- [ ] Hämta alla möten: `GET /api/meetings`
- [ ] Uppdatera mötesstatus: `PATCH /api/meetings/:id/status`
- [ ] Hämta statistik: `GET /api/stats/summary`
- [ ] Hämta trenddata: `GET /api/stats/trends`
- [ ] Konfigurera Azure AD och testa OAuth-login
- [ ] Synkronisera möten från Outlook: `POST /auth/sync`
- [ ] Skapa möte från länk: `POST /api/meetings/from-link`

---

## 🚀 Produktionskonfiguration

När du är redo för produktion:

1. Uppdatera `.env` för production:
   - Sätt `NODE_ENV=production`
   - Använd stark `SESSION_SECRET`
   - Uppdatera `DATABASE_URL` till produktionsdatabas
   - Uppdatera `AZURE_REDIRECT_URI` till produktions-URL

2. Bygg projektet:
   ```bash
   npm run build
   ```

3. Kör produktionsservern:
   ```bash
   npm start
   ```

4. Överväg att använda process manager (PM2, systemd)

---

## 📚 Mer information

- [Fullständig README](README.md)
- [Prisma dokumentation](https://www.prisma.io/docs/)
- [Express dokumentation](https://expressjs.com/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
