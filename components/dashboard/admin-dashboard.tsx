'use client';

// Admin/Manager dashboard - System-wide stats view
import { useStats } from '@/lib/hooks/use-stats';
import { JWTPayload } from '@/lib/auth/jwt';
import StatCard from '@/components/stats/stat-card';
import TrendChart from '@/components/stats/trend-chart';
import StatusChart from '@/components/stats/status-chart';
import Spinner from '@/components/ui/spinner';
import ErrorMessage from '@/components/ui/error-message';
import Badge from '@/components/ui/badge';
import { Calendar, TrendingUp, Users, CheckCircle } from 'lucide-react';

export interface AdminDashboardProps {
  user: JWTPayload;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const { stats, loading, error } = useStats();

  return (
    <>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <ErrorMessage message={error} variant="card" className="mb-6" />
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Stats Grid */}
        {!loading && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Dagens bokningar"
                value={stats.today.dagens_bokningar}
                icon={Calendar}
              />
              <StatCard
                label="Veckans bokningar"
                value={stats.week.veckans_bokningar}
                icon={TrendingUp}
              />
              <StatCard
                label="Månadens bokningar"
                value={stats.month.manadens_bokningar}
                icon={Users}
              />
              <StatCard
                label="Show Rate"
                value={`${Math.round(stats.month.show_rate * 100)}%`}
                icon={CheckCircle}
              />
            </div>

            {/* Additional KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Månadens översikt</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Genomförda</dt>
                    <dd className="text-sm font-semibold text-green-600">{stats.month.genomforda}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">No-shows</dt>
                    <dd className="text-sm font-semibold text-amber-600">{stats.month.noshows}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Avbokningar</dt>
                    <dd className="text-sm font-semibold text-gray-600">{stats.month.avbokningar}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Ombokningar</dt>
                    <dd className="text-sm font-semibold text-blue-600">{stats.month.ombokningar}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Kvalitet</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-telink-violet mb-2">
                    {stats.month.kvalitet_genomsnitt.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Genomsnittligt betyg</div>
                  <div className="mt-4 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.round(stats.month.kvalitet_genomsnitt)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Totalt</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Alla bokningar</dt>
                    <dd className="text-sm font-semibold text-telink-violet">{stats.total.total_bokningar}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Genomförda</dt>
                    <dd className="text-sm font-semibold text-green-600">{stats.total.genomforda}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Total show rate</dt>
                    <dd className="text-sm font-semibold text-telink-violet">
                      {Math.round(stats.total.show_rate * 100)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">No-show rate</dt>
                    <dd className="text-sm font-semibold text-amber-600">
                      {Math.round(stats.total.no_show_rate * 100)}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TrendChart
                data={[
                  { date: 'Mån', bokningar: stats.week.veckans_bokningar || 0, genomforda: stats.week.genomforda || 0, noshows: stats.week.noshows || 0 },
                  { date: 'Tis', bokningar: stats.today.dagens_bokningar || 0, genomforda: stats.today.genomforda || 0, noshows: stats.today.noshows || 0 },
                  { date: 'Ons', bokningar: stats.month.manadens_bokningar || 0, genomforda: stats.month.genomforda || 0, noshows: stats.month.noshows || 0 },
                  { date: 'Tor', bokningar: 0, genomforda: 0, noshows: 0 },
                  { date: 'Fre', bokningar: 0, genomforda: 0, noshows: 0 },
                  { date: 'Lör', bokningar: 0, genomforda: 0, noshows: 0 },
                  { date: 'Sön', bokningar: 0, genomforda: 0, noshows: 0 },
                ]}
              />
              <StatusChart
                data={[
                  { name: 'Genomförd', value: stats.month.genomforda, color: '#10b981' },
                  { name: 'No-show', value: stats.month.noshows, color: '#f59e0b' },
                  { name: 'Avbokad', value: stats.month.avbokningar, color: '#6b7280' },
                  { name: 'Ombokad', value: stats.month.ombokningar, color: '#8b5cf6' },
                ]}
              />
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Användarinfo
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Namn</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Roll</dt>
                  <dd className="mt-1">
                    <Badge variant={user.role.toLowerCase() as any} size="sm">
                      {user.role}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-xs text-gray-900 font-mono">{user.sub}</dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </main>
    </>
  );
}
