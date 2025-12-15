'use client';

import { UserStats } from '@/lib/hooks/use-stats-by-person';
import Badge from '@/components/ui/badge';
import { Star, TrendingUp, TrendingDown, Users } from 'lucide-react';

export interface PersonStatsTableProps {
  stats: UserStats[];
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

export default function PersonStatsTable({
  stats,
  className = '',
}: PersonStatsTableProps) {
  if (!stats || stats.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          Välj personer för att se deras statistik
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Statistik per person
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {stats.length} {stats.length === 1 ? 'person' : 'personer'} visas
        </p>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      <div className="p-6 space-y-6">
        {stats.map((userStat) => (
          <div
            key={userStat.user.id}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-telink-violet flex items-center justify-center text-white text-sm font-semibold">
                  {userStat.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {userStat.user.name}
                    </h4>
                    <Badge
                      variant={ROLE_BADGE_VARIANTS[userStat.user.role] || 'user'}
                      size="xs"
                    >
                      {ROLE_LABELS[userStat.user.role] || userStat.user.role}
                    </Badge>
                    {!userStat.user.isActive && (
                      <span className="text-xs text-gray-500">(Inaktiv)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{userStat.user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-telink-violet">
                  {userStat.combined.total}
                </div>
                <div className="text-xs text-gray-500">Totalt möten</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* As Booker */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Som Bokare
                </h5>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-blue-700">Totalt:</dt>
                    <dd className="font-semibold text-blue-900">
                      {userStat.asBooker.total}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-blue-700">Genomförda:</dt>
                    <dd className="font-semibold text-green-600">
                      {userStat.asBooker.completed}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-blue-700">No-shows:</dt>
                    <dd className="font-semibold text-amber-600">
                      {userStat.asBooker.noShow}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-blue-700">Avbokade:</dt>
                    <dd className="font-semibold text-gray-600">
                      {userStat.asBooker.canceled}
                    </dd>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex justify-between items-center text-sm">
                      <dt className="text-blue-700 font-medium">Show Rate:</dt>
                      <dd className="flex items-center gap-1">
                        {userStat.asBooker.showRate >= 0.8 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-amber-600" />
                        )}
                        <span className={`font-bold ${
                          userStat.asBooker.showRate >= 0.8
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}>
                          {Math.round(userStat.asBooker.showRate * 100)}%
                        </span>
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* As Seller */}
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Som Säljare
                </h5>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-green-700">Totalt:</dt>
                    <dd className="font-semibold text-green-900">
                      {userStat.asSeller.total}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-green-700">Genomförda:</dt>
                    <dd className="font-semibold text-green-600">
                      {userStat.asSeller.completed}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-green-700">No-shows:</dt>
                    <dd className="font-semibold text-amber-600">
                      {userStat.asSeller.noShow}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-green-700">Avbokade:</dt>
                    <dd className="font-semibold text-gray-600">
                      {userStat.asSeller.canceled}
                    </dd>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <div className="flex justify-between items-center text-sm">
                      <dt className="text-green-700 font-medium">Show Rate:</dt>
                      <dd className="flex items-center gap-1">
                        {userStat.asSeller.showRate >= 0.8 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-amber-600" />
                        )}
                        <span className={`font-bold ${
                          userStat.asSeller.showRate >= 0.8
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}>
                          {Math.round(userStat.asSeller.showRate * 100)}%
                        </span>
                      </dd>
                    </div>
                  </div>
                  {userStat.asSeller.avgQualityScore !== null && (
                    <div className="pt-2 border-t border-green-200">
                      <div className="flex justify-between items-center text-sm">
                        <dt className="text-green-700 font-medium flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Kvalitet:
                        </dt>
                        <dd className="flex items-center gap-1">
                          <span className="font-bold text-yellow-600">
                            {userStat.asSeller.avgQualityScore.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({userStat.asSeller.qualityScoreCount} betyg)
                          </span>
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
