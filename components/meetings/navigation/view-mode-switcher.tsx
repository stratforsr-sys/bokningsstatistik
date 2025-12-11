'use client';

import { List, Calendar, Columns3 } from 'lucide-react';
import { useMeetingsStore, ViewMode } from '@/lib/stores/meetings-store';

export default function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useMeetingsStore();

  const modes: { value: ViewMode; label: string; icon: typeof List }[] = [
    { value: 'list', label: 'Lista', icon: List },
    { value: 'calendar', label: 'Kalender', icon: Calendar },
    { value: 'board', label: 'Board', icon: Columns3 },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.value;

        return (
          <button
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-200
              ${
                isActive
                  ? 'bg-white text-telink-violet shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            aria-label={`Switch to ${mode.label} view`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
