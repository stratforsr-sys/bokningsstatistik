'use client';

import { usePathname } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { useLayoutStore } from '@/lib/stores/layout-store';

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['Dashboard'],
  '/meetings': ['Möten'],
  '/meetings/new': ['Möten', 'Nytt möte'],
  '/users': ['Användare'],
};

export default function Topbar() {
  const pathname = usePathname();
  const { toggleSidebar } = useLayoutStore();

  // Get breadcrumbs based on pathname
  const getBreadcrumbs = (): string[] => {
    // Check for exact match first
    if (breadcrumbMap[pathname]) {
      return breadcrumbMap[pathname];
    }

    // Check for dynamic routes (e.g., /meetings/[id])
    if (pathname.startsWith('/meetings/') && pathname !== '/meetings/new') {
      return ['Möten', 'Mötesdetaljer'];
    }

    // Default fallback
    return ['Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Left: Menu button + Breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-telink-violet focus:ring-offset-2"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                )}
                <span
                  className={`
                    ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-900 font-semibold'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* Right: Future expansion (notifications, quick actions, etc.) */}
        <div className="flex items-center gap-3">
          {/* Placeholder for future features */}
        </div>
      </div>
    </header>
  );
}
