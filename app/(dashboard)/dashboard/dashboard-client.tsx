'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { JWTPayload } from '@/lib/auth/jwt';

export default function DashboardClient({ user }: { user: JWTPayload }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Telink Mötesstatistik
            </h1>
            <p className="text-gray-600 mt-1">
              Välkommen, {user.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Roll: <span className="font-medium text-gray-900">{user.role}</span>
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logga ut
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Dashboard
          </h2>
          <p className="text-gray-600">
            Detta är en grundläggande dashboard. Statistik och möten kommer läggas till snart.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stats-card">
              <h3 className="text-sm font-medium text-gray-500">Dagens bokningar</h3>
              <p className="text-3xl font-bold text-telink-violet mt-2">0</p>
            </div>
            <div className="stats-card">
              <h3 className="text-sm font-medium text-gray-500">Veckans bokningar</h3>
              <p className="text-3xl font-bold text-telink-violet mt-2">0</p>
            </div>
            <div className="stats-card">
              <h3 className="text-sm font-medium text-gray-500">Månadens bokningar</h3>
              <p className="text-3xl font-bold text-telink-violet mt-2">0</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Användarinfo
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{user.sub}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
