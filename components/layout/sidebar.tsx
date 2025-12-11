'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Calendar, Users, LogOut, Loader2 } from 'lucide-react';
import { useLayoutStore } from '@/lib/stores/layout-store';
import { useAuth } from '@/lib/hooks/use-auth';
import { JWTPayload } from '@/lib/auth/jwt';
import Badge from '@/components/ui/badge';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/meetings', label: 'Möten', icon: Calendar },
  { path: '/users', label: 'Användare', icon: Users, adminOnly: true },
];

interface SidebarProps {
  user: JWTPayload;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useLayoutStore();
  const { logout } = useAuth();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleNavClick = (path: string) => {
    if (path !== pathname) {
      setLoadingPath(path);
      // Loading state will be cleared when pathname changes
    }
  };

  // Clear loading state when pathname changes
  useEffect(() => {
    setLoadingPath(null);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Filter menu items baserat på användarens roll
  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || user.role === 'ADMIN'
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 w-64
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-telink-violet">
            Telink
          </h1>
          <p className="text-xs text-gray-500 mt-1">Mötesstatistik</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isLoading = loadingPath === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-telink-violet text-white'
                      : isLoading
                      ? 'bg-telink-violet/20 text-telink-violet'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isLoading ? 'pointer-events-none' : ''}
                `}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                <span className="font-medium text-sm">{item.label}</span>
                {isLoading && (
                  <span className="ml-auto text-xs opacity-75">Laddar...</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-telink-violet flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <Badge variant={user.role.toLowerCase() as any} size="sm">
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-gray-700 hover:bg-gray-100
              transition-colors duration-200
              mt-2
            "
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium text-sm">Logga ut</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
