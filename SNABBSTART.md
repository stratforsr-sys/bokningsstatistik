# SNABBSTART - Skapa din första person och möte

## ✅ Servrar körs redan!
- Backend: http://localhost:3000
- Frontend: http://localhost:5174 (OBS! Port 5174)

## Steg 1: Skapa en person (VIKTIGT!)

1. **Öppna**: http://localhost:5174/users

2. **Klicka "Lägg till person"**

3. **Fyll i formuläret**:
   - Namn: Ditt namn (t.ex. "Anna Andersson")
   - Email: Din email (t.ex. "anna@företag.se")
   - Roll: Välj "Mötesbokare"

4. **Klicka "Skapa person"**

5. **Kopiera User ID**:
   - Du får se personen i listan
   - Klicka "Kopiera ID"-knappen på personkortet
   - ID:t sparas i clipboard

## Steg 2: Skapa ett möte

1. **Gå till**: http://localhost:5174/meetings/new

2. **Fyll i formuläret**:
   - **Ämne**: t.ex. "Demo med kund"
   - **Starttid**: Välj datum och tid
   - **Bokare (User ID)**: Klistra in ID:t du kopierade (eller lämna tomt för system-användare)
   - **Sluttid**: Valfritt (sätts automatiskt till +1 timme)
   - **Ägare**, **Länk**, **Anteckningar**: Allt valfritt

3. **Klicka "Skapa möte"**

4. **Du kommer till detaljvyn** för det nya mötet!

## Steg 3: Testa funktioner

### Se alla möten:
http://localhost:5174/meetings

### Se statistik:
http://localhost:5174/

### Hantera personer:
http://localhost:5174/users

## API-endpoints (för testning)

### Skapa person:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Person","email":"test@test.se","role":"BOOKER"}'
```

### Hämta alla personer:
```bash
curl http://localhost:3000/api/users
```

### Skapa möte:
```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "subject":"Testmöte",
    "startTime":"2025-12-03T14:00:00",
    "bookerId":"<USER-ID-HÄR>"
  }'
```

## Troubleshooting

### Frontend visar gammal version?
- Tryck **Ctrl + Shift + R** (hard refresh)
- Eller stäng och öppna webbläsaren

### Fel vid skapande av möte: "Foreign key constraint"?
- Du har angett ett User ID som inte finns
- Gå till /users och skapa en person först
- Eller lämna User ID tomt så skapas system-användare automatiskt

### Backend startar inte?
```bash
cd backend
npm run dev
```

### Frontend startar inte?
```bash
cd frontend
npm run dev
```

## Snabblänkar

- 👥 Personer: http://localhost:5174/users
- 📅 Alla möten: http://localhost:5174/meetings
- ➕ Nytt möte: http://localhost:5174/meetings/new
- 📊 Dashboard: http://localhost:5174/

---

**KLART! Börja med att skapa en person på /users!**
