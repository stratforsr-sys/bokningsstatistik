import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/Button';
import './NewMeeting.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * NewMeeting - Formulär för att skapa nytt möte manuellt
 * Inspirerad av Calendly, HubSpot och Microsoft Bookings
 */
export const NewMeeting: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookerId, setBookerId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ladda användare vid mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Fel vid hämtning av användare:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validera formulär
    if (!subject.trim()) {
      setError('Ämne är obligatoriskt');
      return;
    }

    if (!startTime) {
      setError('Starttid är obligatorisk');
      return;
    }

    setLoading(true);

    try {
      // Konvertera datetime-local format till ISO 8601
      // datetime-local ger "YYYY-MM-DDTHH:mm" utan timezone
      // Vi behöver konvertera till lokal ISO-sträng
      const startDateTime = new Date(startTime);
      const startISO = startDateTime.toISOString();

      let endISO: string | undefined;
      if (endTime && endTime.trim() !== '') {
        const endDateTime = new Date(endTime);
        endISO = endDateTime.toISOString();
      }

      // Rensa tomma strängar för optional fields
      const finalBookerId = bookerId && bookerId.trim() !== '' ? bookerId.trim() : undefined;
      const finalOwnerId = ownerId && ownerId.trim() !== '' ? ownerId.trim() : undefined;
      const finalOrganizerEmail = organizerEmail && organizerEmail.trim() !== '' ? organizerEmail.trim() : undefined;
      const finalJoinUrl = joinUrl && joinUrl.trim() !== '' ? joinUrl.trim() : undefined;
      const finalNotes = notes && notes.trim() !== '' ? notes.trim() : undefined;

      console.log('Creating meeting with:', {
        subject: subject.trim(),
        startTime: startISO,
        endTime: endISO,
        bookerId: finalBookerId,
        ownerId: finalOwnerId,
      });

      const newMeeting = await api.createMeeting({
        subject: subject.trim(),
        startTime: startISO,
        endTime: endISO,
        bookerId: finalBookerId,
        ownerId: finalOwnerId,
        organizerEmail: finalOrganizerEmail,
        joinUrl: finalJoinUrl,
        notes: finalNotes,
      });

      alert('Möte skapat!');
      navigate(`/meetings/${newMeeting.id}`);
    } catch (err: any) {
      console.error('Fel vid skapande av möte:', err);
      setError(err.message || 'Kunde inte skapa möte. Kontrollera att alla fält är korrekta.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Är du säker på att du vill avbryta? Alla ändringar kommer försvinna.')) {
      navigate('/meetings');
    }
  };

  return (
    <div className="new-meeting-page">
      {/* Header */}
      <header className="page-header">
        <div className="container">
          <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>
            ← Tillbaka till alla möten
          </Button>
          <h1>Skapa nytt möte</h1>
          <p className="subtitle">Fyll i informationen nedan för att boka ett nytt möte manuellt</p>
        </div>
      </header>

      {/* Form */}
      <div className="container">
        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-card">
            <h2>Grundläggande information</h2>

            {error && (
              <div className="error-banner">
                <p>{error}</p>
              </div>
            )}

            <div className="form-field required">
              <label htmlFor="subject">Ämne / Titel</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="t.ex. Demo med kund X"
                className="form-input"
                required
              />
              <span className="field-hint">Namnet på mötet som kommer visas i listan</span>
            </div>

            <div className="form-row">
              <div className="form-field required">
                <label htmlFor="startTime">Starttid</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="endTime">Sluttid</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="form-input"
                />
                <span className="field-hint">Lämna tom för 1 timme automatiskt</span>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2>Deltagare och ägare (valfritt)</h2>

            <div className="form-field">
              <label htmlFor="bookerId">Bokare</label>
              {usersLoading ? (
                <select className="form-select" disabled>
                  <option>Laddar användare...</option>
                </select>
              ) : (
                <select
                  id="bookerId"
                  value={bookerId}
                  onChange={(e) => setBookerId(e.target.value)}
                  className="form-select"
                >
                  <option value="">System-användare (automatisk)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}
              <span className="field-hint">
                Valfritt - om tomt används automatiskt en system-användare
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="ownerId">Ägare</label>
              {usersLoading ? (
                <select className="form-select" disabled>
                  <option>Laddar användare...</option>
                </select>
              ) : (
                <select
                  id="ownerId"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="form-select"
                >
                  <option value="">Samma som bokare</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              )}
              <span className="field-hint">
                Valfritt - om tomt används samma som bokare
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="organizerEmail">Organisatör (email)</label>
              <input
                type="email"
                id="organizerEmail"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="email@företag.se"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-card">
            <h2>Ytterligare information</h2>

            <div className="form-field">
              <label htmlFor="joinUrl">Teams/Zoom-länk</label>
              <input
                type="url"
                id="joinUrl"
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                placeholder="https://teams.microsoft.com/..."
                className="form-input"
              />
              <span className="field-hint">
                Länk till online-mötet om det finns
              </span>
            </div>

            <div className="form-field">
              <label htmlFor="notes">Anteckningar</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interna anteckningar om mötet..."
                rows={4}
                className="form-textarea"
              />
              <span className="field-hint">
                Synligt endast internt, kommer inte delas med kunden
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleCancel}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
            >
              {loading ? 'Skapar möte...' : 'Skapa möte'}
            </Button>
          </div>
        </form>

        {/* Help Card */}
        <div className="help-card">
          <h3>Snabbt och enkelt!</h3>
          <p>För att skapa ett möte behöver du endast:</p>
          <ul>
            <li>Ett mötesämne</li>
            <li>En starttid</li>
          </ul>
          <p>
            Allt annat är valfritt! Om du inte anger bokare/ägare skapas mötet automatiskt
            med en system-användare. Du kan alltid redigera mötet senare.
          </p>
        </div>
      </div>
    </div>
  );
};

