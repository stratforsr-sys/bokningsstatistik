'use client';

import { useState } from 'react';
import { UserStats } from '@/lib/hooks/use-stats-by-person';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface GlassmorphicLeaderboardProps {
  stats: UserStats[];
  className?: string;
}

export default function GlassmorphicLeaderboard({
  stats,
  className = '',
}: GlassmorphicLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'total' | 'showRate' | 'quality'>('total');

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

  const getShowRateTrend = (showRate: number) => {
    if (showRate >= 0.85) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (showRate >= 0.70) {
      return <Minus className="h-4 w-4 text-yellow-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (!stats || stats.length === 0) {
    return (
      <div className={`glass-leaderboard ${className}`}>
        <div className="p-8 text-center text-gray-500">
          Ingen data att visa
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-leaderboard ${className}`}>
      {/* Header with gradient glass effect */}
      <div className="glass-leaderboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Leaderboard
            </h3>
            <p className="text-sm text-white/80 mt-1">
              Rankade efter {sortBy === 'total' ? 'antal möten' : sortBy === 'showRate' ? 'show rate' : 'kvalitetsbetyg'}
            </p>
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('total')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sortBy === 'total'
                  ? 'bg-white text-telink-violet shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Möten
            </button>
            <button
              onClick={() => setSortBy('showRate')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sortBy === 'showRate'
                  ? 'bg-white text-telink-violet shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Show Rate
            </button>
            <button
              onClick={() => setSortBy('quality')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                sortBy === 'quality'
                  ? 'bg-white text-telink-violet shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Kvalitet
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Namn
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Möten
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Show Rate
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kvalitet
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((userStat, index) => {
              const rank = index + 1;
              const rankIcon = getRankIcon(rank);
              const showRateTrend = getShowRateTrend(userStat.asBooker.showRate);

              return (
                <tr
                  key={userStat.user.id}
                  className="glass-leaderboard-row"
                >
                  {/* Rank */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {rankIcon || (
                        <span className="text-base font-bold text-gray-600">#{rank}</span>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-telink-violet to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {userStat.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {userStat.user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {userStat.asBooker.completed} genomförda
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Total Meetings */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-xl font-bold text-telink-violet">
                      {userStat.asBooker.total}
                    </div>
                  </td>

                  {/* Show Rate */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {showRateTrend}
                      <span
                        className={`text-base font-bold ${
                          userStat.asBooker.showRate >= 0.85
                            ? 'text-green-600'
                            : userStat.asBooker.showRate >= 0.70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.round(userStat.asBooker.showRate * 100)}%
                      </span>
                    </div>
                  </td>

                  {/* Quality */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {userStat.asSeller.avgQualityScore !== null ? (
                      <div>
                        <div className="text-base font-bold text-yellow-600">
                          {userStat.asSeller.avgQualityScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          av 5.0
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {sortedStats.length}
            </div>
            <div className="text-xs text-gray-500 uppercase">Användare</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                (sortedStats.filter((s) => s.asBooker.showRate >= 0.80).length /
                  sortedStats.length) *
                  100
              )}
              %
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
