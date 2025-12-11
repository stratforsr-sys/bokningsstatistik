'use client';

import { Plus } from 'lucide-react';
import ViewModeSwitcher from '@/components/meetings/navigation/view-mode-switcher';
import Badge from '@/components/ui/badge';
import { JWTPayload } from '@/lib/auth/jwt';

interface MeetingsHeaderProps {
  user: JWTPayload;
  meetingCount?: number;
  onCreateMeeting: () => void;
}

export default function MeetingsHeader({
  user,
  meetingCount = 0,
  onCreateMeeting,
}: MeetingsHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top row: Title and User Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Möten</h1>
            <p className="text-gray-600 mt-1">
              {meetingCount} {meetingCount === 1 ? 'möte' : 'möten'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={user.role.toLowerCase() as any} size="md">
              {user.role}
            </Badge>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-telink-violet flex items-center justify-center text-white font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: View Switcher and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <ViewModeSwitcher />

          <button
            onClick={onCreateMeeting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-telink-violet rounded-lg hover:bg-telink-violet-dark transition-colors focus:outline-none focus:ring-2 focus:ring-telink-violet focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nytt möte</span>
          </button>
        </div>
      </div>
    </div>
  );
}
