import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from '../components/Button';
import type { Meeting, MeetingStatus } from '../types';
import './MeetingsList.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * MeetingsList - Lista alla möten med filter och sök
 * Inspirerad av Calendly, HubSpot Meetings, Microsoft Bookings
 */
export const MeetingsList: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<MeetingStatus | ''>('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Users state för filter chips
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Status översättning och färgkodning (samma som Calendly/HubSpot)
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

  // Hämta användare vid mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Debounce search query (vänta 300ms efter användaren slutar skriva)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hämta möten vid mount och när filter ändras
  useEffect(() => {
    loadMeetings();
  }, [filterStatus, filterUserId, filterStartDate, filterEndDate, debouncedSearchQuery]);

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

  const loadMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filterUserId) params.user_id = filterUserId;
      if (filterStatus) params.status = filterStatus;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (debouncedSearchQuery) params.query = debouncedSearchQuery;

      const data = await api.getMeetings(params);
      setMeetings(data);
    } catch (err: any) {
      console.error('Fel vid hämtning av möten:', err);
      setError('Kunde inte ladda möten. Kontrollera att backend körs.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
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
    if (isNaN(time.getTime())) return 'Invalid time';
    return time.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterUserId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  return (
    <div className="meetings-list-page">
      {/* Header */}
      <header className="page-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Alla möten</h1>
              <p className="subtitle">Hantera och följ upp dina bokningar</p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/meetings/new')}
            >
              + Skapa nytt möte
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="filters-section">
        <div className="container">
          <div className="filters-card">
            <h2 className="filters-title">Sök och filtrera möten</h2>

            {/* Search Field */}
            <div className="filter-section">
              <label className="filter-label">Sök möten:</label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök på titel, anteckningar eller datum (YYYY-MM-DD)..."
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}
                    title="Rensa sökning"
                  >
                    ✕
                  </button>
                )}
              </div>
              {debouncedSearchQuery && (
                <div className="search-info">
                  Söker efter: <strong>{debouncedSearchQuery}</strong>
                </div>
              )}
            </div>

            {/* Person Filter Chips */}
            <div className="filter-section">
              <label className="filter-label">Filtrera per person:</label>
              <div className="person-chips">
                <button
                  className={`person-chip ${filterUserId === '' ? 'active' : ''}`}
                  onClick={() => setFilterUserId('')}
                >
                  Alla
                </button>
                {usersLoading ? (
                  <span className="filter-loading">Laddar...</span>
                ) : (
                  users.map((user) => (
                    <button
                      key={user.id}
                      className={`person-chip ${filterUserId === user.id ? 'active' : ''}`}
                      onClick={() => setFilterUserId(user.id)}
                      title={`${user.name} (${user.email})`}
                    >
                      {user.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="filterStatus">Status</label>
                <select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as MeetingStatus | '')}
                  className="filter-select"
                >
                  <option value="">Alla statusar</option>
                  <option value="BOOKED">Bokad</option>
                  <option value="COMPLETED">Genomförd</option>
                  <option value="NO_SHOW">No-show</option>
                  <option value="CANCELED">Avbokad</option>
                  <option value="RESCHEDULED">Ombokad</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="filterStartDate">Från datum</label>
                <input
                  type="date"
                  id="filterStartDate"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div className="filter-field">
                <label htmlFor="filterEndDate">Till datum</label>
                <input
                  type="date"
                  id="filterEndDate"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filters-actions">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Rensa filter
              </Button>
              <Button variant="secondary" size="sm" onClick={loadMeetings}>
                Uppdatera
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Meetings Table */}
      <section className="meetings-section">
        <div className="container">
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={loadMeetings}>
                Försök igen
              </Button>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Laddar möten...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="empty-state">
              <p>Inga möten hittades</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/meetings/new')}>
                Skapa ditt första möte
              </Button>
            </div>
          ) : (
            <div className="meetings-table-wrapper">
              <div className="meetings-count">
                {meetings.length} {meetings.length === 1 ? 'möte' : 'möten'}
              </div>
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
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className="meeting-row">
                      <td>{formatDate(meeting.startTime)}</td>
                      <td>
                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                      </td>
                      <td className="meeting-subject">
                        <strong>{meeting.subject || 'Utan ämne'}</strong>
                      </td>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/meetings/${meeting.id}`)}
                        >
                          Visa detaljer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
