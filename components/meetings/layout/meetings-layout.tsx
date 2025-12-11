'use client';

import { useMeetingsStore } from '@/lib/stores/meetings-store';
import { JWTPayload } from '@/lib/auth/jwt';
import MeetingsHeader from './meetings-header';
import MeetingsToolbar from './meetings-toolbar';
import ListView from '../views/list-view';
import CalendarView from '../views/calendar-view';
import BoardView from '../views/board-view';

interface MeetingsLayoutProps {
  user: JWTPayload;
  meetings: any[];
  onCreateMeeting: () => void;
}

export default function MeetingsLayout({
  user,
  meetings,
  onCreateMeeting,
}: MeetingsLayoutProps) {
  const { viewMode } = useMeetingsStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MeetingsHeader
        user={user}
        meetingCount={meetings.length}
        onCreateMeeting={onCreateMeeting}
      />

      {/* Toolbar */}
      <MeetingsToolbar />

      {/* Content Area - View Dependent */}
      <main>
        {viewMode === 'list' && <ListView meetings={meetings} />}
        {viewMode === 'calendar' && <CalendarView meetings={meetings} />}
        {viewMode === 'board' && <BoardView meetings={meetings} />}
      </main>
    </div>
  );
}
