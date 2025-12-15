'use client';

import { UserStats } from '@/lib/hooks/use-stats-by-person';
import Badge from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from 'lucide-react';

export interface LeaderboardProps {
  stats: UserStats[];
  sortBy?: 'total' | 'showRate' | 'quality';
  className?: string;
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'Användare',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

const ROLE_BADGE_VARIANTS: Record<string, 'user' | 'manager' | 'admin'> = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export default function Leaderboard({
  stats,
  sortBy = 'total',
  className = '',
}: LeaderboardProps) {
  // Sort stats based on selected metric
  const sortedStats = [...stats].sort((a, b) => {
    switch (sortBy) {
      case 'showRate':
        return b.asBooker.showRate - a.asBooker.showRate;
      case 'quality':
        return (b.asSeller.avgQualityScore || 0) - (a.asSeller.avgQualityScore || 0);
      case 'total':
      default:
        return b.asBooker.total - a.asBooker.total;
    }
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    const totalUsers = sortedStats.length;
    const percentile = rank / totalUsers;

    if (percentile <= 0.2) return 'bg-green-50 border-green-200';
    if (percentile <= 0.4) return 'bg-blue-50 border-blue-200';
    if (percentile <= 0.6) return 'bg-yellow-50 border-yellow-200';
    if (percentile <= 0.8) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getPerformanceLabel = (rank: number, total: number) => {
    const percentile = rank / total;

    if (percentile <= 0.2) return { label: 'Top Performer', color: 'text-green-700' };
    if (percentile <= 0.4) return { label: 'Strong', color: 'text-blue-700' };
    if (percentile <= 0.6) return { label: 'Solid', color: 'text-yellow-700' };
    if (percentile <= 0.8) return { label: 'Developing', color: 'text-orange-700' };
    return { label: 'Needs Improvement', color: 'text-red-700' };
  };

  if (!stats || stats.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <p className="text-gray-500">Ingen data att visa</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-telink-violet to-purple-600">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboard - Topp Prestationer
        </h3>
        <p className="text-sm text-purple-100 mt-1">
          Rankade efter {sortBy === 'total' ? 'antal möten' : sortBy === 'showRate' ? 'show rate' : 'kvalitetsbetyg'}
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Namn
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Möten
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Show Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kvalitet
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedStats.map((userStat, index) => {
              const rank = index + 1;
              const performance = getPerformanceLabel(rank, sortedStats.length);
              const rankIcon = getRankIcon(rank);

              return (
                <tr
                  key={userStat.user.id}
                  className={`hover:bg-gray-50 transition-colors ${getRankColor(rank)} border-l-4`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {rankIcon || (
                        <span className="text-lg font-bold text-gray-600">#{rank}</span>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-telink-violet flex items-center justify-center text-white font-semibold">
                        {userStat.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {userStat.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userStat.user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Meetings */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-2xl font-bold text-telink-violet">
                      {userStat.asBooker.total}
                    </div>
                    <div className="text-xs text-gray-500">
                      {userStat.asBooker.completed} genomförda
                    </div>
                  </td>

                  {/* Show Rate */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {userStat.asBooker.showRate >= 0.85 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : userStat.asBooker.showRate >= 0.70 ? (
                        <Minus className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-lg font-bold ${
                        userStat.asBooker.showRate >= 0.85
                          ? 'text-green-600'
                          : userStat.asBooker.showRate >= 0.70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {Math.round(userStat.asBooker.showRate * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Quality */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userStat.asSeller.avgQualityScore !== null ? (
                      <div>
                        <div className="text-lg font-bold text-yellow-600">
                          {userStat.asSeller.avgQualityScore.toFixed(1)} / 5.0
                        </div>
                        <div className="text-xs text-gray-500">
                          {userStat.asSeller.qualityScoreCount} betyg
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Ingen data</span>
                    )}
                  </td>

                  {/* Performance Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={rank <= 3 ? 'completed' : rank <= stats.length * 0.5 ? 'booked' : 'no-show'}
                      size="sm"
                    >
                      {performance.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {sortedStats.length}
            </div>
            <div className="text-xs text-gray-500 uppercase">Totalt Användare</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((sortedStats.filter(s => s.asBooker.showRate >= 0.80).length / sortedStats.length) * 100)}%
            </div>
            <div className="text-xs text-gray-500 uppercase">Med 80%+ Show Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {sortedStats.reduce((sum, s) => sum + s.asBooker.total, 0)}
            </div>
            <div className="text-xs text-gray-500 uppercase">Totalt Möten</div>
          </div>
        </div>
      </div>
    </div>
  );
}
