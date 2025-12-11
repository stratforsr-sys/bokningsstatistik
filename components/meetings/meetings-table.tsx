import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import MeetingStatusBadge from './meeting-status-badge';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface Meeting {
  id: string;
  subject: string | null;
  startTime: string;
  endTime: string;
  ownerName: string;
  status: string;
  qualityScore: number | null;
}

interface MeetingsTableProps {
  meetings: Meeting[];
  loading?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function MeetingsTable({
  meetings,
  loading,
  onView,
  onEdit,
  onDelete,
}: MeetingsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-telink-violet border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Laddar möten...</p>
        </div>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">Inga möten hittades</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ämne
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum & Tid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ägare
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kvalitet
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {meetings.map((meeting) => (
              <tr
                key={meeting.id}
                className="meeting-row hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {meeting.subject || 'Inget ämne'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(meeting.startTime), 'PPP', { locale: sv })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(meeting.startTime), 'HH:mm')} -{' '}
                    {format(new Date(meeting.endTime), 'HH:mm')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{meeting.ownerName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <MeetingStatusBadge status={meeting.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {meeting.qualityScore ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-yellow-600">
                        {meeting.qualityScore}
                      </span>
                      <svg
                        className="h-4 w-4 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(meeting.id)}
                        className="text-telink-violet hover:text-telink-violet-dark"
                        title="Visa"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(meeting.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Redigera"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(meeting.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Ta bort"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
