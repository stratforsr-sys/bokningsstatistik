'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  Star,
  Columns3,
} from 'lucide-react';
import Badge from '@/components/ui/badge';

interface Meeting {
  id: string;
  outlookEventId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  subject: string | null;
  organizerEmail: string;
  status: string;
  statusReason: string | null;
  qualityScore: number | null;
  notes: string | null;
  bookerName: string;
  ownerName: string;
}

interface BoardViewProps {
  meetings: Meeting[];
}

const COLUMNS = [
  {
    id: 'BOOKED',
    title: 'Bokade',
    color: 'bg-blue-100',
    borderColor: 'border-blue-300',
    badgeVariant: 'info' as const,
  },
  {
    id: 'COMPLETED',
    title: 'Genomförda',
    color: 'bg-green-100',
    borderColor: 'border-green-300',
    badgeVariant: 'success' as const,
  },
  {
    id: 'NO_SHOW',
    title: 'No-show',
    color: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    badgeVariant: 'warning' as const,
  },
  {
    id: 'CANCELED',
    title: 'Avbokade',
    color: 'bg-red-100',
    borderColor: 'border-red-300',
    badgeVariant: 'error' as const,
  },
  {
    id: 'RESCHEDULED',
    title: 'Ombokade',
    color: 'bg-gray-100',
    borderColor: 'border-gray-300',
    badgeVariant: 'neutral' as const,
  },
];

interface MeetingCardProps {
  meeting: Meeting;
  isDragging?: boolean;
}

function MeetingCard({ meeting, isDragging = false }: MeetingCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: meeting.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
          {meeting.subject || 'Inget ämne'}
        </h3>
        {meeting.qualityScore && (
          <div className="flex items-center gap-1 ml-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-gray-700">
              {meeting.qualityScore}
            </span>
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{format(startTime, 'd MMM yyyy', { locale: sv })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <span>
            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
          </span>
        </div>
      </div>

      {/* Owner */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-telink-violet flex items-center justify-center text-white text-xs font-semibold">
          {meeting.ownerName.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-gray-700 truncate">{meeting.ownerName}</span>
      </div>

      {/* Notes preview */}
      {meeting.notes && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 line-clamp-2">{meeting.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function BoardView({ meetings }: BoardViewProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group meetings by status
  const meetingsByStatus = useMemo(() => {
    const grouped: Record<string, Meeting[]> = {
      BOOKED: [],
      COMPLETED: [],
      NO_SHOW: [],
      CANCELED: [],
      RESCHEDULED: [],
    };

    meetings.forEach((meeting) => {
      if (grouped[meeting.status]) {
        grouped[meeting.status].push(meeting);
      }
    });

    return grouped;
  }, [meetings]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveDragId(null);
      return;
    }

    const meetingId = active.id as string;
    const newStatus = over.id as string;

    // Find the meeting being dragged
    const meeting = meetings.find((m) => m.id === meetingId);

    if (!meeting || meeting.status === newStatus) {
      setActiveDragId(null);
      return;
    }

    // Update status via API
    try {
      const res = await fetch(`/api/meetings/${meetingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }

      // Force a refresh of the meetings list to show the updated status
      window.location.reload();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
      alert('Kunde inte uppdatera mötets status. Försök igen.');
    }

    setActiveDragId(null);
  };

  const activeMeeting = activeDragId
    ? meetings.find((m) => m.id === activeDragId)
    : null;

  // Empty state
  if (meetings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Columns3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inga möten hittades
          </h3>
          <p className="text-gray-500">
            Det finns inga möten att visa på board.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {COLUMNS.map((column) => {
            const columnMeetings = meetingsByStatus[column.id] || [];

            return (
              <SortableContext
                key={column.id}
                id={column.id}
                items={columnMeetings.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col h-full min-h-[600px]">
                  {/* Column Header */}
                  <div className={`${column.color} ${column.borderColor} border-2 rounded-t-lg p-4`}>
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900">{column.title}</h2>
                      <Badge variant={column.badgeVariant} size="sm">
                        {columnMeetings.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Droppable Area */}
                  <div
                    className={`flex-1 ${column.color} ${column.borderColor} border-x-2 border-b-2 rounded-b-lg p-3 space-y-3 overflow-y-auto`}
                  >
                    {columnMeetings.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        Inga möten
                      </div>
                    ) : (
                      columnMeetings.map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          isDragging={meeting.id === activeDragId}
                        />
                      ))
                    )}
                  </div>
                </div>
              </SortableContext>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeMeeting && <MeetingCard meeting={activeMeeting} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
