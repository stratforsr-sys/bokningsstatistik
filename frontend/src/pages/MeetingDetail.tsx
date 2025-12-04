import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/Button';
import type { Meeting, MeetingStatus } from '../types';
import './MeetingDetail.css';

/**
 * MeetingDetail - Detaljvy för ett enskilt möte
 * Inspirerad av Calendly, HubSpot Meetings och Microsoft Bookings
 *
 * Funktioner:
 * - Visa all mötesinfo
 * - Uppdatera status med knappar (no-show, completed, canceled, rescheduled)
 * - Sätta kvalitetspoäng (1-5)
 * - Ändra datum/tid (reschedule)
 * - Redigera ämne, deltagare, anteckningar
 * - Ta bort möte
 */
export const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Status update state
  const [selectedQuality, setSelectedQuality] = useState(3);

  // Status konfiguration
  const statusConfig: Record<
    MeetingStatus,
    { label: string; color: string; bgColor: string; action: string }
  > = {
    BOOKED: {
      label: 'Bokad',
      color: '#644ff7',
      bgColor: '#f3f0ff',
      action: 'Markera som bokad'
    },
    COMPLETED: {
      label: 'Genomförd',
      color: '#00884b',
      bgColor: '#e8f5e9',
      action: 'Markera som genomförd'
    },
    NO_SHOW: {
      label: 'No-show',
      color: '#f44336',
      bgColor: '#ffebee',
      action: 'Markera som no-show'
    },
    CANCELED: {
      label: 'Avbokad',
      color: '#9e9e9e',
      bgColor: '#f5f5f5',
      action: 'Avboka möte'
    },
    RESCHEDULED: {
      label: 'Ombokad',
      color: '#ff9800',
      bgColor: '#fff3e0',
      action: 'Markera som ombokad'
    },
  };

  // Hämta möte vid mount
  useEffect(() => {
    if (id) {
      loadMeeting();
    }
  }, [id]);

  // Uppdatera edit-formulär när möte laddas
  useEffect(() => {
    if (meeting) {
      setEditSubject(meeting.subject || '');
      setEditStartTime(formatDateTimeLocal(meeting.startTime));
      setEditEndTime(formatDateTimeLocal(meeting.endTime));
      setEditNotes(meeting.notes || '');
      setSelectedQuality(meeting.qualityScore || 3);
    }
  }, [meeting]);

  const loadMeeting = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getMeeting(id);
      setMeeting(data);
    } catch (err: any) {
      console.error('Fel vid hämtning av möte:', err);
      setError('Kunde inte ladda möte. Kontrollera att ID är korrekt.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: MeetingStatus) => {
    if (!id) return;

    setSaving(true);
    try {
      const quality = status === 'COMPLETED' ? selectedQuality : undefined;
      await api.updateMeetingStatus(id, {
        status,
        quality_score: quality,
      });
      await loadMeeting();
      alert(`Mötet markerades som: ${statusConfig[status].label}`);
    } catch (err: any) {
      console.error('Fel vid uppdatering av status:', err);
      alert('Kunde inte uppdatera status. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!id) return;

    setSaving(true);
    try {
      await api.updateMeeting(id, {
        subject: editSubject,
        startTime: editStartTime,
        endTime: editEndTime,
        notes: editNotes,
      });
      await loadMeeting();
      setIsEditMode(false);
      alert('Ändringar sparade!');
    } catch (err: any) {
      console.error('Fel vid uppdatering av möte:', err);
      alert('Kunde inte spara ändringar. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hardDelete: boolean = false) => {
    if (!id) return;

    const confirmMsg = hardDelete
      ? 'Vill du ta bort detta möte permanent? Detta går inte att ångra.'
      : 'Vill du avboka detta möte? Status kommer sättas till CANCELED.';

    if (!confirm(confirmMsg)) return;

    setSaving(true);
    try {
      await api.deleteMeeting(id, hardDelete);
      alert(hardDelete ? 'Möte borttaget' : 'Möte avbokat');
      navigate('/meetings');
    } catch (err: any) {
      console.error('Fel vid borttagning av möte:', err);
      alert('Kunde inte ta bort möte. Försök igen.');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="meeting-detail-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Laddar möte...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="meeting-detail-page">
        <div className="error-state">
          <h2>Kunde inte ladda möte</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate('/meetings')}>
            Tillbaka till listan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="container">
          <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>
            ← Tillbaka till alla möten
          </Button>
          <div className="header-title">
            <h1>{meeting.subject || 'Utan ämne'}</h1>
            <span
              className="status-badge"
              style={{
                color: statusConfig[meeting.status].color,
                backgroundColor: statusConfig[meeting.status].bgColor,
              }}
            >
              {statusConfig[meeting.status].label}
            </span>
          </div>
        </div>
      </header>

      <div className="container detail-content">
        {/* Main Info Card */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Mötesdetaljer</h2>
            {!isEditMode && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditMode(true)}
              >
                Redigera
              </Button>
            )}
          </div>

          {isEditMode ? (
            <div className="edit-form">
              <div className="form-field">
                <label htmlFor="editSubject">Ämne</label>
                <input
                  type="text"
                  id="editSubject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="editStartTime">Starttid</label>
                  <input
                    type="datetime-local"
                    id="editStartTime"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="editEndTime">Sluttid</label>
                  <input
                    type="datetime-local"
                    id="editEndTime"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="editNotes">Anteckningar</label>
                <textarea
                  id="editNotes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="form-textarea"
                />
              </div>

              <div className="form-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                  disabled={saving}
                >
                  Avbryt
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdits}
                  disabled={saving}
                >
                  {saving ? 'Sparar...' : 'Spara ändringar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Ämne</span>
                <span className="info-value">{meeting.subject || '-'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Starttid</span>
                <span className="info-value">{formatDateTime(meeting.startTime)}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Sluttid</span>
                <span className="info-value">{formatDateTime(meeting.endTime)}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Organisatör</span>
                <span className="info-value">{meeting.organizerEmail || '-'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Bokare</span>
                <span className="info-value">
                  {meeting.booker?.name || meeting.bookerId || '-'}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Ägare</span>
                <span className="info-value">
                  {meeting.owner?.name || meeting.ownerId || '-'}
                </span>
              </div>

              {meeting.joinUrl && (
                <div className="info-item full-width">
                  <span className="info-label">Teams-länk</span>
                  <a
                    href={meeting.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    Öppna mötet i Teams
                  </a>
                </div>
              )}

              {meeting.notes && (
                <div className="info-item full-width">
                  <span className="info-label">Anteckningar</span>
                  <span className="info-value">{meeting.notes}</span>
                </div>
              )}

              {meeting.qualityScore && (
                <div className="info-item">
                  <span className="info-label">Kvalitetspoäng</span>
                  <span className="info-value quality-score">
                    {meeting.qualityScore} / 5
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="detail-card">
          <h2>Snabbåtgärder</h2>
          <p className="card-description">
            Uppdatera mötets status med ett klick
          </p>

          {/* Status Buttons */}
          <div className="action-buttons">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleUpdateStatus('COMPLETED')}
              disabled={saving || meeting.status === 'COMPLETED'}
            >
              ✓ Genomförd
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => handleUpdateStatus('NO_SHOW')}
              disabled={saving || meeting.status === 'NO_SHOW'}
            >
              ✗ No-show
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => handleUpdateStatus('CANCELED')}
              disabled={saving || meeting.status === 'CANCELED'}
            >
              Avboka
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => handleUpdateStatus('RESCHEDULED')}
              disabled={saving || meeting.status === 'RESCHEDULED'}
            >
              Omboka
            </Button>
          </div>

          {/* Quality Score (only for COMPLETED) */}
          {meeting.status === 'COMPLETED' && (
            <div className="quality-section">
              <label htmlFor="qualityScore">Kvalitetspoäng (1-5)</label>
              <select
                id="qualityScore"
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(Number(e.target.value))}
                className="quality-select"
              >
                <option value={1}>1 - Dålig</option>
                <option value={2}>2 - Mindre bra</option>
                <option value={3}>3 - OK</option>
                <option value={4}>4 - Bra</option>
                <option value={5}>5 - Utmärkt</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus('COMPLETED')}
                disabled={saving}
              >
                Uppdatera kvalitet
              </Button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="detail-card danger-zone">
          <h2>Farlig zon</h2>
          <p className="card-description">
            Dessa åtgärder går inte att ångra
          </p>
          <div className="danger-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(false)}
              disabled={saving}
            >
              Avboka möte (soft delete)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(true)}
              disabled={saving}
              style={{ color: '#dc2626' }}
            >
              Ta bort permanent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
