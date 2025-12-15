'use client';

import { useState } from 'react';
import PersonFilter from '@/components/stats/person-filter';
import PersonStatsTable from '@/components/stats/person-stats-table';
import Leaderboard from '@/components/stats/leaderboard';
import KPICards from '@/components/stats/kpi-cards';
import { useStatsByPerson } from '@/lib/hooks/use-stats-by-person';
import { AlertCircle, BarChart3 } from 'lucide-react';

interface StatsClientProps {
  user: {
    sub: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function StatsClient({ user }: StatsClientProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [view, setView] = useState<'overview' | 'detailed'>('overview');

  // Fetch stats for selected users (only booker stats as requested)
  const { stats, loading, error } = useStatsByPerson({
    userIds: selectedUserIds,
    role: 'booker', // Only show booker stats for now
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Statistik per person
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Filtrera och visa statistik för bokare och säljare
          </p>
          {user.role === 'USER' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Begränsad åtkomst</p>
                  <p className="mt-1">
                    Som användare kan du endast se statistik för möten där du är delaktig.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <PersonFilter
            selectedUserIds={selectedUserIds}
            onFilterChange={setSelectedUserIds}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Fel vid hämtning av statistik</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-telink-violet border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Laddar statistik...</p>
          </div>
        )}

        {/* View Tabs */}
        {selectedUserIds.length > 0 && !loading && !error && stats && stats.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'overview'
                  ? 'bg-telink-violet text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Översikt
            </button>
            <button
              onClick={() => setView('detailed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'detailed'
                  ? 'bg-telink-violet text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Detaljerad
            </button>
          </div>
        )}

        {/* Overview View */}
        {!loading && !error && stats && stats.length > 0 && view === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <KPICards stats={stats} />

            {/* Leaderboard */}
            <Leaderboard stats={stats} sortBy="total" />
          </div>
        )}

        {/* Detailed View */}
        {!loading && !error && stats && stats.length > 0 && view === 'detailed' && (
          <PersonStatsTable stats={stats} />
        )}

        {/* Empty State - No Users Selected */}
        {!loading && !error && (!stats || stats.length === 0) && selectedUserIds.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Välj personer för att se statistik
            </h3>
            <p className="text-gray-600">
              Använd filtret ovan för att välja en eller flera personer
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Om statistiken
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Bokare:</strong> Personer som har bokat möten för säljare.
            </p>
            <p>
              <strong>Säljare:</strong> Personer som genomför möten med kunder.
            </p>
            <p>
              <strong>Show Rate:</strong> Procentandel av möten där kunden dök upp (genomförda möten / totalt antal möten).
            </p>
            <p>
              <strong>Kvalitetsbetyg:</strong> Genomsnittligt betyg (1-5) för genomförda möten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
