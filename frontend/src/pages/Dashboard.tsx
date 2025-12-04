import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../components/StatsCard';
import { MeetingsTable } from '../components/MeetingsTable';
import { AddMeetingModal } from '../components/AddMeetingModal';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import type { StatsSummary, Meeting, MeetingStatus, User } from '../types';
import './Dashboard.css';

/**
 * Dashboard - Huvudsida för mötesstatistik
 *
 * UXAgent: Visar 4 stats-kort för olika perioder + möteslista
 * AnalyticsAgent: Beräknar och visualiserar KPIs med färgkodning
 * BookingUXAgent: Enkla filter och statusuppdatering
 */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout, isAdmin } = useAuth();

  // State för statistik
  const [stats, setStats] = useState<{
    today?: StatsSummary;
    week?: StatsSummary;
    month?: StatsSummary;
    total?: StatsSummary;
  }>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // State för möten
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState<string | null>(null);

  // Filter state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showMeetings, setShowMeetings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Users state för filter chips
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  // Hämta statistik vid mount och när userId ändras
  useEffect(() => {
    loadStats();
  }, [selectedUserId]);

  // Hämta möten vid mount och när filter eller sökning ändras
  useEffect(() => {
    loadMeetings();
  }, [selectedUserId, debouncedSearchQuery]);

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

  const loadStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const userId = selectedUserId || undefined;
      const data = await api.getAllStats(userId);
      setStats(data);
    } catch (error) {
      console.error('Fel vid hämtning av statistik:', error);
      setStatsError('Kunde inte ladda statistik. Kontrollera att backend körs.');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadMeetings = async () => {
    setMeetingsLoading(true);
    setMeetingsError(null);
    try {
      const userId = selectedUserId || undefined;
      const params: any = { user_id: userId };
      if (debouncedSearchQuery) params.query = debouncedSearchQuery;

      const data = await api.getMeetings(params);
      // Säkerställ att data är en array
      if (Array.isArray(data)) {
        setMeetings(data);
      } else {
        console.error('API returnerade ingen array:', data);
        setMeetings([]);
        setMeetingsError('Ogiltigt svar från servern.');
      }
    } catch (error) {
      console.error('Fel vid hämtning av möten:', error);
      setMeetingsError('Kunde inte ladda möten.');
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    meetingId: string,
    status: MeetingStatus,
    quality?: number
  ) => {
    await api.updateMeetingStatus(meetingId, {
      status,
      quality_score: quality,
    });

    // Uppdatera både stats och meetings efter statusändring
    await Promise.all([loadStats(), loadMeetings()]);
  };

  const handleAddMeeting = async (link: string) => {
    await api.createMeetingFromLink(link);

    // Uppdatera både stats och meetings efter att möte lagts till
    await Promise.all([loadStats(), loadMeetings()]);
  };

  // Insiktstext baserad på statistik (AnalyticsAgent)
  const getInsightText = () => {
    if (!stats.week) return '';

    const { veckans_bokningar, genomforda, noshows, show_rate } = stats.week;
    const showRatePercent = (show_rate * 100).toFixed(0);

    return `Denna vecka: ${veckans_bokningar} bokningar, ${genomforda} genomförda, ${noshows} no-shows (show rate ${showRatePercent}%)`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="container">
          <div className="header-top">
            <div>
              <h1 className="dashboard-title">Telink Mötesstatistik</h1>
              <p className="dashboard-subtitle">
                Översikt över dina bokningar och mötesstatistik
              </p>
            </div>
            <div className="user-info">
              <div className="user-details">
                <span className="user-name">{currentUser?.name}</span>
                <span className="user-role">{currentUser?.role}</span>
              </div>
              <div className="header-actions">
                {isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/users')}
                  >
                    Hantera användare
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logga ut
                </Button>
              </div>
            </div>
          </div>

          {/* Insikter */}
          {stats.week && (
            <div className="insights-banner">
              <span className="insights-icon">📊</span>
              <p className="insights-text">{getInsightText()}</p>
            </div>
          )}
        </div>
      </header>

      {/* Person Filter Chips */}
      <div className="dashboard-filters">
        <div className="container">
          <div className="filter-section">
            <label className="filter-label">Filtrera per person:</label>
            <div className="person-chips">
              <button
                className={`person-chip ${selectedUserId === '' ? 'active' : ''}`}
                onClick={() => setSelectedUserId('')}
              >
                Alla
              </button>
              {usersLoading ? (
                <span className="filter-loading">Laddar...</span>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    className={`person-chip ${selectedUserId === user.id ? 'active' : ''}`}
                    onClick={() => setSelectedUserId(user.id)}
                    title={`${user.name} (${user.email})`}
                  >
                    {user.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <section className="dashboard-stats">
        <div className="container">
          {statsError && (
            <div className="error-banner">
              <p>{statsError}</p>
              <Button variant="secondary" size="sm" onClick={loadStats}>
                Försök igen
              </Button>
            </div>
          )}

          <div className="stats-grid">
            <StatsCard
              title="Idag"
              period="Dagens statistik"
              bokningar={stats.today?.dagens_bokningar || 0}
              avbokningar={stats.today?.avbokningar || 0}
              ombokningar={stats.today?.ombokningar || 0}
              noshows={stats.today?.noshows || 0}
              genomforda={stats.today?.genomforda || 0}
              showRate={stats.today?.show_rate || 0}
              noShowRate={stats.today?.no_show_rate || 0}
              kvalitet={stats.today?.kvalitet_genomsnitt || 0}
              isLoading={statsLoading}
            />

            <StatsCard
              title="Denna vecka"
              period="Veckans statistik"
              bokningar={stats.week?.veckans_bokningar || 0}
              avbokningar={stats.week?.avbokningar || 0}
              ombokningar={stats.week?.ombokningar || 0}
              noshows={stats.week?.noshows || 0}
              genomforda={stats.week?.genomforda || 0}
              showRate={stats.week?.show_rate || 0}
              noShowRate={stats.week?.no_show_rate || 0}
              kvalitet={stats.week?.kvalitet_genomsnitt || 0}
              isLoading={statsLoading}
            />

            <StatsCard
              title="Denna månad"
              period="Månadens statistik"
              bokningar={stats.month?.manadens_bokningar || 0}
              avbokningar={stats.month?.avbokningar || 0}
              ombokningar={stats.month?.ombokningar || 0}
              noshows={stats.month?.noshows || 0}
              genomforda={stats.month?.genomforda || 0}
              showRate={stats.month?.show_rate || 0}
              noShowRate={stats.month?.no_show_rate || 0}
              kvalitet={stats.month?.kvalitet_genomsnitt || 0}
              isLoading={statsLoading}
            />

            <StatsCard
              title="Totalt"
              period="All-time statistik"
              bokningar={stats.total?.total_bokningar || 0}
              avbokningar={stats.total?.avbokningar || 0}
              ombokningar={stats.total?.ombokningar || 0}
              noshows={stats.total?.noshows || 0}
              genomforda={stats.total?.genomforda || 0}
              showRate={stats.total?.show_rate || 0}
              noShowRate={stats.total?.no_show_rate || 0}
              kvalitet={stats.total?.kvalitet_genomsnitt || 0}
              isLoading={statsLoading}
            />
          </div>
        </div>
      </section>

      {/* Meetings Table */}
      <section className="dashboard-meetings">
        <div className="container">
          <div className="section-header">
            <h2>Möteslista (senaste)</h2>
            <div className="section-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/users')}
              >
                👥 Personer
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/meetings')}
              >
                Se alla möten
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
              >
                ➕ Lägg till möte
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMeetings(!showMeetings)}
              >
                {showMeetings ? 'Dölj' : 'Visa'} möten
              </Button>
            </div>
          </div>

          {showMeetings && (
            <>
              {/* Search Field */}
              <div className="meeting-search-section">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Sök möten (titel, anteckningar, datum)..."
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

              {meetingsError && (
                <div className="error-banner">
                  <p>{meetingsError}</p>
                  <Button variant="secondary" size="sm" onClick={loadMeetings}>
                    Försök igen
                  </Button>
                </div>
              )}

              <MeetingsTable
                meetings={meetings}
                isLoading={meetingsLoading}
                onStatusUpdate={handleStatusUpdate}
              />
            </>
          )}
        </div>
      </section>

      {/* Add Meeting Modal */}
      <AddMeetingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMeeting}
      />
    </div>
  );
};
