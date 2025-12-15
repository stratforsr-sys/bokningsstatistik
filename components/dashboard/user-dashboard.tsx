'use client';

import { useStats } from '@/lib/hooks/use-stats';
import { useStatsByPerson } from '@/lib/hooks/use-stats-by-person';
import ComparisonStatCard from '@/components/dashboard/comparison-stat-card';
import GlassmorphicLeaderboard from '@/components/dashboard/glassmorphic-leaderboard';
import { Calendar, CheckCircle2, XCircle, TrendingUp, Star, Users } from 'lucide-react';

export interface UserDashboardProps {
  user: {
    sub: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const { stats, comparison, loading: statsLoading, error: statsError } = useStats();
  const { stats: allUserStats, loading: leaderboardLoading, error: leaderboardError } = useStatsByPerson({});

  if (statsLoading || leaderboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telink-violet"></div>
      </div>
    );
  }

  if (statsError || leaderboardError) {
    return (
      <div className="glass-card bg-red-50 border-red-200">
        <p className="text-red-800">
          Error loading dashboard: {statsError || leaderboardError}
        </p>
      </div>
    );
  }

  const monthStats = stats?.month;
  const weekStats = stats?.week;
  const todayStats = stats?.today;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="glass-card glass-gradient">
        <h1 className="text-3xl font-bold text-white mb-2">
          Välkommen, {user.name}!
        </h1>
        <p className="text-white/80 text-lg">
          Här är din personliga översikt och teamets prestation
        </p>
      </div>

      {/* Personal KPI Cards with Team Comparison */}
      {comparison && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-telink-violet" />
            Dina Prestationer (Denna Månad)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Meetings */}
            <ComparisonStatCard
              label="Totalt Möten"
              icon={Calendar}
              personalValue={comparison.personal.totalMeetings}
              teamValue={comparison.teamAverage.totalMeetings}
            />

            {/* Show Rate */}
            <ComparisonStatCard
              label="Show Rate"
              icon={CheckCircle2}
              personalValue={Math.round(comparison.personal.showRate * 100)}
              teamValue={Math.round(comparison.teamAverage.showRate * 100)}
              suffix="%"
            />

            {/* Quality Score */}
            <ComparisonStatCard
              label="Kvalitetsbetyg"
              icon={Star}
              personalValue={comparison.personal.quality.toFixed(1)}
              teamValue={comparison.teamAverage.quality.toFixed(1)}
            />

            {/* Completed */}
            <ComparisonStatCard
              label="Genomförda Möten"
              icon={CheckCircle2}
              personalValue={comparison.personal.completed}
              teamValue={Math.round(comparison.teamAverage.totalMeetings * comparison.teamAverage.showRate)}
            />

            {/* No Shows */}
            <ComparisonStatCard
              label="No-Shows"
              icon={XCircle}
              personalValue={comparison.personal.noShows}
              teamValue={Math.round(comparison.teamAverage.totalMeetings * (1 - comparison.teamAverage.showRate))}
            />

            {/* Team Info */}
            <div className="glass-stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>

              <h3 className="text-sm font-medium text-gray-600 mb-3">
                Teamstorlek
              </h3>

              <div className="mb-3">
                <div className="text-3xl font-bold text-telink-violet">
                  {comparison.totalUsers}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Aktiva användare
                </div>
              </div>

              <div className="glass-divider my-3"></div>

              <div className="text-xs text-gray-600">
                Du tävlar mot {comparison.totalUsers - 1} andra säljare
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - This Week */}
      {weekStats && (
        <div className="glass-card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Denna Vecka
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-telink-violet">
                {weekStats.veckans_bokningar}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Bokningar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weekStats.genomforda}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Genomförda</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {Math.round(weekStats.show_rate * 100)}%
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Show Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {weekStats.kvalitet_genomsnitt ? weekStats.kvalitet_genomsnitt.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Kvalitet</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Stats */}
      {todayStats && todayStats.dagens_bokningar > 0 && (
        <div className="glass-card glass-subtle">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Idag
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-telink-violet">
                {todayStats.dagens_bokningar}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Bokningar</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {todayStats.genomforda}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">Genomförda</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">
                {todayStats.noshows}
              </div>
              <div className="text-xs text-gray-500 uppercase mt-1">No-Shows</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {allUserStats && allUserStats.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-telink-violet" />
            Team Leaderboard
          </h2>
          <GlassmorphicLeaderboard stats={allUserStats} />
        </div>
      )}
    </div>
  );
}
