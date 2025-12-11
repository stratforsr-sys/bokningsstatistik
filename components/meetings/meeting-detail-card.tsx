'use client';

import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, User, Star, FileText, Link as LinkIcon } from 'lucide-react';
import Card from '@/components/ui/card';
import MeetingStatusBadge from './meeting-status-badge';

interface Meeting {
  id: string;
  subject: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  notes?: string | null;
  qualityScore?: number | null;
  outlookLink?: string | null;
  owner?: {
    name: string;
    email: string;
  } | null;
}

interface MeetingDetailCardProps {
  meeting: Meeting;
}

export default function MeetingDetailCard({ meeting }: MeetingDetailCardProps) {
  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);

  return (
    <Card>
      <Card.Header>
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{meeting.subject}</h2>
          <MeetingStatusBadge status={meeting.status} />
        </div>
      </Card.Header>
      <Card.Body>
        <dl className="space-y-4">
          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <dt className="text-sm font-medium text-gray-500">Datum</dt>
              <dd className="text-sm text-gray-900">
                {format(startDate, 'EEEE d MMMM yyyy', { locale: sv })}
              </dd>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <dt className="text-sm font-medium text-gray-500">Tid</dt>
              <dd className="text-sm text-gray-900">
                {format(startDate, 'HH:mm', { locale: sv })} -{' '}
                {format(endDate, 'HH:mm', { locale: sv })}
              </dd>
            </div>
          </div>

          {/* Owner */}
          {meeting.owner && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Ägare</dt>
                <dd className="text-sm text-gray-900">{meeting.owner.name}</dd>
                <dd className="text-xs text-gray-500">{meeting.owner.email}</dd>
              </div>
            </div>
          )}

          {/* Quality Score */}
          {meeting.qualityScore && (
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Kvalitetsbetyg</dt>
                <dd className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= meeting.qualityScore!
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {meeting.qualityScore} av 5
                  </span>
                </dd>
              </div>
            </div>
          )}

          {/* Notes */}
          {meeting.notes && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 mb-1">Anteckningar</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-md p-3 border border-gray-200">
                  {meeting.notes}
                </dd>
              </div>
            </div>
          )}

          {/* Outlook Link */}
          {meeting.outlookLink && (
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Outlook-länk</dt>
                <dd>
                  <a
                    href={meeting.outlookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-telink-violet hover:text-telink-violet-dark underline"
                  >
                    Öppna i Outlook
                  </a>
                </dd>
              </div>
            </div>
          )}
        </dl>
      </Card.Body>
    </Card>
  );
}
