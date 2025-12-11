'use client';

import { useMemo, useState, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/sv';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon } from 'lucide-react';
import Badge from '@/components/ui/badge';

// Set Swedish locale for moment
moment.locale('sv');
const localizer = momentLocalizer(moment);

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

interface CalendarViewProps {
  meetings: Meeting[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Meeting;
}

const statusColors: Record<string, string> = {
  BOOKED: '#3b82f6', // Blue
  COMPLETED: '#10b981', // Green
  NO_SHOW: '#f59e0b', // Yellow/Orange
  CANCELED: '#ef4444', // Red
  RESCHEDULED: '#6b7280', // Gray
};

const statusLabels: Record<string, string> = {
  BOOKED: 'Bokad',
  COMPLETED: 'Genomförd',
  NO_SHOW: 'No-show',
  CANCELED: 'Avbokad',
  RESCHEDULED: 'Ombokad',
};

export default function CalendarView({ meetings }: CalendarViewProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Transform meetings to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    return meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.subject || 'Inget ämne',
      start: new Date(meeting.startTime),
      end: new Date(meeting.endTime),
      resource: meeting,
    }));
  }, [meetings]);

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    const backgroundColor = statusColors[status] || '#6b7280';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 6px',
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Handle closing event details
  const handleCloseDetails = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center gap-1 truncate">
      <span className="font-medium">{event.title}</span>
      <span className="text-xs opacity-75">({event.resource.ownerName})</span>
    </div>
  );

  // Messages for Swedish localization
  const messages = {
    allDay: 'Heldag',
    previous: 'Föregående',
    next: 'Nästa',
    today: 'Idag',
    month: 'Månad',
    week: 'Vecka',
    day: 'Dag',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Tid',
    event: 'Händelse',
    noEventsInRange: 'Inga möten i detta intervall.',
    showMore: (total: number) => `+${total} fler`,
  };

  // Empty state
  if (meetings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inga möten hittades
          </h3>
          <p className="text-gray-500">
            Det finns inga möten att visa i kalendern.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Calendar Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Kalender - {meetings.length} möten
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: statusColors[key] }}
                    ></div>
                    <span className="text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Component */}
        <div className="p-6" style={{ height: '700px' }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            components={{
              event: EventComponent,
            }}
            messages={messages}
            popup
            selectable
            style={{ height: '100%' }}
          />
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedEvent.resource.subject || 'Inget ämne'}
                  </h2>
                  <Badge
                    variant={
                      selectedEvent.resource.status === 'COMPLETED'
                        ? 'completed'
                        : selectedEvent.resource.status === 'BOOKED'
                        ? 'booked'
                        : selectedEvent.resource.status === 'NO_SHOW'
                        ? 'no-show'
                        : selectedEvent.resource.status === 'CANCELED'
                        ? 'canceled'
                        : 'rescheduled'
                    }
                    size="lg"
                  >
                    {statusLabels[selectedEvent.resource.status] || selectedEvent.resource.status}
                  </Badge>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Date & Time */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Datum & Tid
                </h3>
                <div className="flex items-center gap-2 text-gray-900">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span>
                    {moment(selectedEvent.start).format('D MMMM YYYY, HH:mm')} -{' '}
                    {moment(selectedEvent.end).format('HH:mm')}
                  </span>
                </div>
              </div>

              {/* Owner */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Ägare
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-telink-violet flex items-center justify-center text-white font-semibold">
                    {selectedEvent.resource.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-900">{selectedEvent.resource.ownerName}</span>
                </div>
              </div>

              {/* Organizer Email */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Organisatör
                </h3>
                <p className="text-gray-900">{selectedEvent.resource.organizerEmail}</p>
              </div>

              {/* Quality Score */}
              {selectedEvent.resource.qualityScore && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Kvalitetsbetyg
                  </h3>
                  <div className="flex items-center gap-1">
                    {'⭐'.repeat(selectedEvent.resource.qualityScore)}
                    <span className="text-gray-600 ml-1">
                      ({selectedEvent.resource.qualityScore}/5)
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEvent.resource.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Anteckningar
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedEvent.resource.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleCloseDetails}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Stäng
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-telink-violet rounded-lg hover:bg-telink-violet-dark transition-colors">
                Redigera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
