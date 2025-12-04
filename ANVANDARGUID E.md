# Telink Boknings-statistik - Användarguide

## Översikt

Detta system är ett komplett möteshanteringsverktyg byggt för Telink, inspirerat av branschledande verktyg som Calendly, HubSpot Meetings och Microsoft Bookings.

## Funktioner

### 1. Dashboard (Startsida)
**URL:** `/`

Här ser du:
- Statistik för olika perioder (Idag, Denna vecka, Denna månad, Totalt)
- Bokningar, genomförda möten, no-shows, avbokningar
- Show rate och genomsnittlig kvalitet
- Senaste möten i en tabell

**Åtgärder:**
- Klicka "Se alla möten" för att gå till fullständiga möteslistan
- Klicka "Lägg till möte" för att lägga till via Outlook-länk

### 2. Alla möten (Möteslista)
**URL:** `/meetings`

En central vy för alla dina möten, liknande Calendly's "Meetings page".

**Funktioner:**
- **Filter**: Filtrera efter status, datum-range, användare
- **Sortering**: Möten sorteras efter datum (senaste först)
- **Snabböversikt**: Se datum, tid, ämne, bokare, ägare, status och kvalitet
- **Färgkodning**:
  - Grön = Genomförd
  - Lila = Bokad
  - Röd = No-show
  - Grå = Avbokad
  - Orange = Ombokad

**Åtgärder:**
- Klicka "Skapa nytt möte" för att manuellt boka ett möte
- Klicka "Visa detaljer" på ett möte för att öppna detaljvyn

### 3. Detaljvy för möte
**URL:** `/meetings/:id`

Här ser du ALLT om ett specifikt möte och kan göra ALLA åtgärder.

**Visad information:**
- Ämne, datum, tid
- Organisatör, bokare, ägare
- Teams-länk (om finns)
- Anteckningar
- Kvalitetspoäng (om genomförd)
- Status

**Snabbåtgärder (inspirerat av Calendly):**
- **Markera som genomförd**: Sätter status till COMPLETED, kan även sätta kvalitet 1-5
- **Markera som no-show**: Kunden dök inte upp
- **Avboka**: Sätter status till CANCELED
- **Omboka**: Markerar som RESCHEDULED

**Redigering:**
- Klicka "Redigera" för att ändra ämne, datum, tid, anteckningar
- Sparar ändringar direkt i databasen

**Ta bort:**
- Soft delete (sätter status till CANCELED)
- Hard delete (permanent borttagning)

### 4. Skapa nytt möte
**URL:** `/meetings/new`

Ett formulär för att manuellt skapa möten när de inte kommer från Outlook.

**Obligatoriska fält:**
- Ämne
- Starttid
- Bokare (User ID)

**Valfria fält:**
- Sluttid (default: +1 timme från start)
- Ägare (User ID, default: samma som bokare)
- Organisatör email
- Teams/Zoom-länk
- Anteckningar

**Tips:**
- Du måste använda giltiga User ID:n från databasen
- Om du inte har User ID:n, skapa användare först via backend

## API Endpoints

### Backend REST API

Alla endpoints har prefix `/api`

#### Möten
- `GET /api/meetings` - Lista alla möten (med filter)
- `GET /api/meetings/:id` - Hämta specifikt möte
- `POST /api/meetings` - Skapa nytt möte manuellt
- `POST /api/meetings/from-link` - Skapa möte från Outlook-länk
- `PATCH /api/meetings/:id` - Uppdatera möte (generell)
- `PATCH /api/meetings/:id/status` - Uppdatera endast status
- `DELETE /api/meetings/:id` - Ta bort möte (soft/hard delete)

#### Statistik
- `GET /api/stats/summary` - Sammanfattande statistik
- `GET /api/stats/detailed` - Detaljerad statistik per användare
- `GET /api/stats/trends` - Trendanalys
- `GET /api/stats/overview` - Komplett översikt

## Best Practices (från Calendly, HubSpot, Microsoft Bookings)

### 1. Status-hantering
- **Bokad (BOOKED)**: Mötet är schemalagt men inte genomfört
- **Genomförd (COMPLETED)**: Mötet hölls, kunden dök upp
  - Sätt alltid kvalitetspoäng 1-5
  - Lägg till anteckningar om behov
- **No-show (NO_SHOW)**: Kunden dök inte upp
  - Viktigt för show rate-statistik
  - Bör följas upp med kund
- **Avbokad (CANCELED)**: Mötet ställdes in, ingen ny tid
- **Ombokad (RESCHEDULED)**: Mötet flyttades till annan tid
  - Skapa nytt möte med ny tid
  - Markera gamla som RESCHEDULED

### 2. Kvalitetspoäng
Använd konsekvent skala:
- **5 - Utmärkt**: Tydligt behov, beslutfattare, progression
- **4 - Bra**: Positivt möte, intresserad kund
- **3 - OK**: Genomfört men oklart intresse
- **2 - Mindre bra**: Fel kontakt eller dålig tajming
- **1 - Dålig**: Misslyckad kvalificering

### 3. Minska no-shows
- Skicka påminnelser (implementeras via backend webhook)
- Ha tydliga kalenderlänkar
- Följ upp snabbt vid no-show

## Workflow-exempel

### Scenario 1: Daglig uppföljning
1. Öppna Dashboard (`/`)
2. Se dagens statistik
3. Klicka "Se alla möten"
4. Filtrera på dagens datum
5. Gå igenom varje möte och uppdatera status:
   - Genomförda → Markera COMPLETED + sätt kvalitet
   - No-shows → Markera NO_SHOW

### Scenario 2: Boka möte manuellt
1. Gå till `/meetings/new`
2. Fyll i ämne: "Demo med Företag AB"
3. Välj datum/tid
4. Ange ditt User ID som bokare
5. Klicka "Skapa möte"
6. Du skickas till detaljvyn för nya mötet

### Scenario 3: Hantera no-show
1. Hitta mötet i `/meetings` eller Dashboard
2. Klicka "Visa detaljer"
3. Klicka "Markera som no-show"
4. Systemet uppdaterar statistiken automatiskt
5. Lägg till anteckning genom att klicka "Redigera"

### Scenario 4: Omboka möte
1. Öppna mötet i detaljvyn
2. Klicka "Omboka" (sätter status RESCHEDULED)
3. Gå till `/meetings/new`
4. Skapa nytt möte med ny tid
5. I anteckningar, referera till gamla mötet

## Tekniska detaljer

### Frontend
- React + TypeScript + Vite
- React Router för navigation
- Responsiv design
- Real-time uppdateringar

### Backend
- Node.js + Express + TypeScript
- Prisma ORM (PostgreSQL)
- Microsoft Graph API integration
- RESTful API

### Starta lokalt

**Backend:**
```bash
cd backend
npm install
npm run dev
# Körs på http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Körs på http://localhost:5173
```

## Vanliga frågor

**Q: Var hittar jag User ID?**
A: User ID finns i databasen (Users-tabellen). Du kan öppna Prisma Studio (`npm run prisma:studio` i backend) för att se alla användare.

**Q: Kan jag redigera gamla möten?**
A: Ja! Öppna mötet i detaljvyn och klicka "Redigera".

**Q: Vad händer om jag tar bort ett möte?**
A: Soft delete sätter status till CANCELED. Hard delete tar bort permanent från databasen.

**Q: Hur fungerar filtrering?**
A: I `/meetings` kan du filtrera på status, datum-range och användare. Klicka "Uppdatera" för att tillämpa.

**Q: Kan jag exportera data?**
A: Ännu inte implementerat, men planerat med CSV-export.

## Support

För tekniska problem eller frågor:
1. Kontrollera att både backend och frontend körs
2. Öppna browser developer tools (F12) för felmeddelanden
3. Kontrollera backend-loggar i terminalen

## Roadmap

Planerade förbättringar:
- [ ] CSV-export av möten
- [ ] Automatiska påminnelser
- [ ] Bulk-uppdatering av status
- [ ] Användarhantering i frontend
- [ ] Grafisk statistik (grafer/charts)
- [ ] Webhook för kalenderändringar
- [ ] Email-notiser
