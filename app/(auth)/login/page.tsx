'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('[LOGIN] Starting login...', { email });
    console.log('[LOGIN] Current URL:', window.location.href);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: Include cookies
        body: JSON.stringify({ email, password }),
      });

      console.log('[LOGIN] Response status:', res.status);
      console.log('[LOGIN] Response headers:', Object.fromEntries(res.headers.entries()));

      const data = await res.json();
      console.log('[LOGIN] Response data:', data);

      if (!res.ok) {
        console.error('[LOGIN] Login failed:', data);
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Check if cookie was set
      console.log('[LOGIN] All cookies (from document.cookie):', document.cookie);

      // Redirect to dashboard on success
      console.log('[LOGIN] Login successful! Redirecting to dashboard...');

      // Wait a bit for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('[LOGIN] About to redirect...');

      // Use window.location for hard redirect to ensure cookies are included
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('[LOGIN] Error during login:', err);
      console.error('[LOGIN] Error stack:', err.stack);
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Telink Mötesstatistik
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Logga in för att fortsätta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-telink-violet focus:border-telink-violet"
                placeholder="din@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lösenord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-telink-violet focus:border-telink-violet"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-telink-violet hover:bg-telink-violet-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-telink-violet disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>

          <div className="mt-4">
            <a
              href="/api/auth/microsoft/login"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Logga in med Microsoft
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
