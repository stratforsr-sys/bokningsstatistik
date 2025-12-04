# API Examples - Telink Boknings-statistik

Denna fil innehåller exempel på API-anrop som du kan använda för testning.

**Basadress**: `http://localhost:3000`

---

## 🔐 Auth Endpoints

### 1. Starta OAuth-login

**Browser:**
```
http://localhost:3000/auth/login
```

Detta redirectar till Microsoft-inloggning. Efter lyckad inloggning får du:

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Användare",
    "email": "test@example.com",
    "role": "BOOKER"
  },
  "accessToken": "eyJ0eXAiOiJKV1QiLCJub25jZSI6..."
}
```

**OBS**: Spara `user.id` och `accessToken` för kommande anrop.

---

### 2. Synkronisera möten från Outlook

```bash
curl -X POST http://localhost:3000/auth/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "limit": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Meetings synced successfully",
  "events": 45,
  "syncResult": {
    "created": 40,
    "updated": 5,
    "skipped": 0
  }
}
```

---

### 3. Hämta användarinfo

```bash
curl http://localhost:3000/auth/me?userId=550e8400-e29b-41d4-a716-446655440000
```

---

## 📅 Meetings Endpoints

### 1. Hämta alla möten

**Alla möten:**
```bash
curl http://localhost:3000/api/meetings
```

**Med filter:**
```bash
# För specifik användare
curl "http://localhost:3000/api/meetings?userId=550e8400-e29b-41d4-a716-446655440000"

# Med status
curl "http://localhost:3000/api/meetings?status=COMPLETED"

# Med datumintervall
curl "http://localhost:3000/api/meetings?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"

# Kombinera filter
curl "http://localhost:3000/api/meetings?userId=550e8400-e29b-41d4-a716-446655440000&status=BOOKED&limit=10"
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "meetings": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "outlookEventId": "AAMkAGI1...",
      "bookingDate": "2025-01-15T10:00:00.000Z",
      "startTime": "2025-01-20T14:00:00.000Z",
      "endTime": "2025-01-20T15:00:00.000Z",
      "subject": "Demo med kund X",
      "organizerEmail": "säljare@företag.se",
      "attendees": "[{\"emailAddress\":{\"name\":\"Kund\",\"address\":\"kund@företag.se\"}}]",
      "joinUrl": "https://teams.microsoft.com/l/meetup-join/...",
      "status": "BOOKED",
      "statusReason": null,
      "qualityScore": null,
      "notes": null,
      "booker": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Bokare Namn",
        "email": "bokare@företag.se",
        "role": "BOOKER"
      },
      "owner": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Säljare Namn",
        "email": "säljare@företag.se",
        "role": "SALES"
      },
      "createdAt": "2025-01-15T10:00:00.000Z",
      "lastUpdated": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Hämta ett specifikt möte

```bash
curl http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

---

### 3. Uppdatera mötesstatus

**Markera som genomfört:**
```bash
curl -X PATCH http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "statusReason": "MET_WITH_DECISION_MAKER",
    "qualityScore": 5,
    "notes": "Mycket produktivt möte. Kunden visade starkt intresse."
  }'
```

**Markera som no-show:**
```bash
curl -X PATCH http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "NO_SHOW",
    "statusReason": "CLIENT_NO_SHOW",
    "notes": "Kunden dök aldrig upp, inget svar på uppföljning."
  }'
```

**Markera som avbokad:**
```bash
curl -X PATCH http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELED",
    "statusReason": "NOT_INTERESTED",
    "notes": "Kunden meddelade att de inte längre är intresserade."
  }'
```

**Markera som ombokad:**
```bash
curl -X PATCH http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESCHEDULED",
    "statusReason": "RESCHEDULED_BY_CLIENT",
    "notes": "Kunden bad om att flytta till nästa vecka."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Meeting status updated",
  "meeting": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "COMPLETED",
    "statusReason": "MET_WITH_DECISION_MAKER",
    "qualityScore": 5,
    "notes": "Mycket produktivt möte. Kunden visade starkt intresse.",
    "lastUpdated": "2025-01-20T15:30:00.000Z"
  }
}
```

---

### 4. Skapa möte från Outlook/Teams-länk

```bash
curl -X POST http://localhost:3000/api/meetings/from-link \
  -H "Content-Type: application/json" \
  -d '{
    "link": "https://outlook.office365.com/calendar/item/AAMkAGI1AAA=",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "ownerId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Exempel på länkar som stöds:**

- Outlook event: `https://outlook.office365.com/calendar/item/AAMkAGI1...`
- Outlook web: `https://outlook.office365.com/owa/?itemid=AAMkAGI1...`
- Teams (begränsad support): `https://teams.microsoft.com/l/meetup-join/...`

**Response:**
```json
{
  "success": true,
  "message": "Meeting created from link",
  "meeting": { ... },
  "action": "created"
}
```

Om mötet redan finns:
```json
{
  "success": true,
  "message": "Meeting already exists",
  "meeting": { ... },
  "action": "found"
}
```

---

### 5. Ta bort möte

**Soft delete (sätt status till CANCELED):**
```bash
curl -X DELETE http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

**Hard delete (permanent borttagning):**
```bash
curl -X DELETE "http://localhost:3000/api/meetings/7c9e6679-7425-40de-944b-e07fc1f90ae7?hardDelete=true"
```

---

## 📊 Stats Endpoints

### 1. Sammanfattande statistik

**Månadsstatistik:**
```bash
curl "http://localhost:3000/api/stats/summary?period=month"
```

**För specifik användare:**
```bash
curl "http://localhost:3000/api/stats/summary?userId=550e8400-e29b-41d4-a716-446655440000&period=month"
```

**Dagens statistik:**
```bash
curl "http://localhost:3000/api/stats/summary?period=today"
```

**Veckans statistik:**
```bash
curl "http://localhost:3000/api/stats/summary?period=week"
```

**Total statistik (all-time):**
```bash
curl "http://localhost:3000/api/stats/summary?period=total"
```

**Custom datumintervall:**
```bash
curl "http://localhost:3000/api/stats/summary?period=total&startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "period": "month",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "dagens_bokningar": 3,
    "veckans_bokningar": 12,
    "manadens_bokningar": 45,
    "total_bokningar": 428,
    "avbokningar": 5,
    "ombokningar": 3,
    "noshows": 4,
    "genomforda": 33,
    "show_rate": 0.89,
    "no_show_rate": 0.11,
    "kvalitet_genomsnitt": 4.2
  }
}
```

---

### 2. Detaljerad statistik per användare

**Alla användare:**
```bash
curl http://localhost:3000/api/stats/detailed
```

**Specifika användare:**
```bash
curl "http://localhost:3000/api/stats/detailed?userIds=550e8400-e29b-41d4-a716-446655440000,660e8400-e29b-41d4-a716-446655440001"
```

**Med datumfilter:**
```bash
curl "http://localhost:3000/api/stats/detailed?startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "stats": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "userName": "Bokare 1",
      "stats": {
        "period": "month",
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "dagens_bokningar": 3,
        "veckans_bokningar": 12,
        "manadens_bokningar": 45,
        "total_bokningar": 428,
        "avbokningar": 5,
        "ombokningar": 3,
        "noshows": 4,
        "genomforda": 33,
        "show_rate": 0.89,
        "no_show_rate": 0.11,
        "kvalitet_genomsnitt": 4.2
      }
    },
    {
      "userId": "660e8400-e29b-41d4-a716-446655440001",
      "userName": "Bokare 2",
      "stats": { ... }
    }
  ]
}
```

---

### 3. Trendanalys

**30 dagars trend:**
```bash
curl "http://localhost:3000/api/stats/trends?days=30"
```

**För specifik användare:**
```bash
curl "http://localhost:3000/api/stats/trends?userId=550e8400-e29b-41d4-a716-446655440000&days=30"
```

**7 dagars trend:**
```bash
curl "http://localhost:3000/api/stats/trends?days=7"
```

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
    {
      "date": "2025-01-02",
      "bokningar": 3,
      "genomforda": 3,
      "noshows": 0
    },
    ...
  ]
}
```

---

### 4. Komplett översikt

```bash
curl "http://localhost:3000/api/stats/overview?userId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:**
```json
{
  "success": true,
  "overview": {
    "today": {
      "period": "today",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "dagens_bokningar": 2,
      "veckans_bokningar": 8,
      "manadens_bokningar": 35,
      "total_bokningar": 412,
      ...
    },
    "week": { ... },
    "month": { ... },
    "total": { ... },
    "trends": [
      { "date": "2025-01-01", "bokningar": 5, "genomforda": 4, "noshows": 1 },
      ...
    ]
  }
}
```

---

## 🔍 Health & System

### Health check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "environment": "development"
}
```

### API Info

```bash
curl http://localhost:3000
```

**Response:**
```json
{
  "message": "Telink Boknings-statistik API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "auth": "/auth",
    "meetings": "/api/meetings",
    "stats": "/api/stats"
  }
}
```

---

## 🧪 Testscenario: Komplett flöde

Här är ett komplett exempel på hur du använder API:et:

### 1. Logga in (OAuth)

Besök i browser:
```
http://localhost:3000/auth/login
```

Spara `user.id` från responsen.

### 2. Synkronisera möten från Outlook

```bash
curl -X POST http://localhost:3000/auth/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "DIN-USER-ID"
  }'
```

### 3. Hämta alla möten

```bash
curl "http://localhost:3000/api/meetings?userId=DIN-USER-ID"
```

Spara ett `meeting.id` från listan.

### 4. Uppdatera mötesstatus

```bash
curl -X PATCH http://localhost:3000/api/meetings/MÖTES-ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "statusReason": "MET_WITH_DECISION_MAKER",
    "qualityScore": 5
  }'
```

### 5. Hämta statistik

```bash
curl "http://localhost:3000/api/stats/summary?userId=DIN-USER-ID&period=month"
```

### 6. Hämta trenddata

```bash
curl "http://localhost:3000/api/stats/trends?userId=DIN-USER-ID&days=30"
```

---

## 📝 Notering

För produktionsanvändning:

- Implementera autentisering/authorization för API-endpoints
- Använd JWT eller sessions istället för att skicka userId i varje request
- Validera all input
- Implementera rate limiting
- Använd HTTPS

---

## 🔗 Relaterade filer

- [README.md](README.md) - Fullständig dokumentation
- [QUICKSTART.md](QUICKSTART.md) - Snabbstartsguide
