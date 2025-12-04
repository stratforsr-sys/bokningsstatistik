import React, { useState } from 'react';
import type { Meeting, MeetingStatus } from '../types';
import './MeetingsTable.css';

interface MeetingsTableProps {
  meetings: Meeting[];
  isLoading?: boolean;
  onStatusUpdate: (
    meetingId: string,
    status: MeetingStatus,
    quality?: number
  ) => Promise<void>;
}

/**
 * MeetingsTable - Visar lista med möten och tillåter statusuppdatering
 * Design enligt Telink's moderna tabell-layout
 */
export const MeetingsTable: React.FC<MeetingsTableProps> = ({
  meetings,
  isLoading = false,
  onStatusUpdate,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Säkerställ att meetings är en array
  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  // Status översättning och färgkodning
  const statusConfig: Record<
    MeetingStatus,
    { label: string; color: string; bgColor: string }
  > = {
    BOOKED: { label: 'Bokad', color: '#644ff7', bgColor: '#f3f0ff' },
    COMPLETED: { label: 'Genomförd', color: '#00884b', bgColor: '#e8f5e9' },
    NO_SHOW: { label: 'No-show', color: '#f44336', bgColor: '#ffebee' },
    CANCELED: { label: 'Avbokad', color: '#9e9e9e', bgColor: '#f5f5f5' },
    RESCHEDULED: { label: 'Ombokad', color: '#ff9800', bgColor: '#fff3e0' },
  };

  const handleQuickStatusChange = async (
    meetingId: string,
    status: MeetingStatus,
    quality?: number
  ) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(meetingId, status, quality);
    } catch (error) {
      console.error('Fel vid snabb statusändring:', error);
      alert('Kunde inte uppdatera status. Försök igen.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Kontrollera om datumet är giltigt
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    const time = new Date(timeString);
    // Kontrollera om tiden är giltig
    if (isNaN(time.getTime())) return 'Invalid time';
    return time.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="meetings-table-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Laddar möten...</p>
        </div>
      </div>
    );
  }

  if (safeMeetings.length === 0) {
    return (
      <div className="meetings-table-container">
        <div className="empty-state">
          <p>Inga möten hittades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meetings-table-container">
      <div className="meetings-table-wrapper">
        <table className="meetings-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Tid</th>
              <th>Ämne</th>
              <th>Bokare</th>
              <th>Ägare</th>
              <th>Status</th>
              <th>Kvalitet</th>
              <th>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {safeMeetings.map((meeting) => (
              <tr key={meeting.id}>
                <td>{formatDate(meeting.bookingDate)}</td>
                <td>
                  {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                </td>
                <td className="meeting-subject">{meeting.subject || '-'}</td>
                <td>{meeting.booker?.name || meeting.bookerId || '-'}</td>
                <td>{meeting.owner?.name || meeting.ownerId || '-'}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      color: statusConfig[meeting.status].color,
                      backgroundColor: statusConfig[meeting.status].bgColor,
                    }}
                  >
                    {statusConfig[meeting.status].label}
                  </span>
                </td>
                <td>
                  {meeting.qualityScore ? (
                    <span className="quality-score">
                      {meeting.qualityScore} / 5
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <div className="quick-actions">
                    {meeting.status === 'BOOKED' && (
                      <>
                        <button
                          className="quick-action-btn completed"
                          onClick={() => handleQuickStatusChange(meeting.id, 'COMPLETED', 4)}
                          disabled={isUpdating}
                          title="Markera som genomförd (kvalitet: 4/5)"
                        >
                          ✓ Genomförd
                        </button>
                        <button
                          className="quick-action-btn no-show"
                          onClick={() => handleQuickStatusChange(meeting.id, 'NO_SHOW')}
                          disabled={isUpdating}
                          title="Markera som no-show"
                        >
                          ✗ No-show
                        </button>
                        <button
                          className="quick-action-btn canceled"
                          onClick={() => handleQuickStatusChange(meeting.id, 'CANCELED')}
                          disabled={isUpdating}
                          title="Avboka mötet"
                        >
                          Avboka
                        </button>
                      </>
                    )}
                    {meeting.status !== 'BOOKED' && (
                      <button
                        className="quick-action-btn reset"
                        onClick={() => handleQuickStatusChange(meeting.id, 'BOOKED')}
                        disabled={isUpdating}
                        title="Återställ till bokad"
                      >
                        ← Återställ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
