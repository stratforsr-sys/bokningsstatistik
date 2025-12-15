'use client';

import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Calendar, Clock, Users, Star, FileText, Link as LinkIcon } from 'lucide-react';
import Card, { CardHeader, CardBody } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import MeetingStatusBadge from './meeting-status-badge';

interface MeetingUser {
  id: string;
  userId: string;
  userName: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

interface Meeting {
  id: string;
  subject: string;
  startTime: string | Date;
  endTime: string | Date;
  status: string;
  notes?: string | null;
  qualityScore?: number | null;
  outlookLink?: string | null;
  // NEW: Multiple bookers and sellers
  bookers?: MeetingUser[];
  sellers?: MeetingUser[];
  // OLD: Backward compatibility
  owner?: {
    name: string;
    email: string;
  } | null;
}

interface MeetingDetailCardProps {
  meeting: Meeting;
}

const ROLE_LABELS: Record<string, string> = {
  USER: 'Användare',
  MANAGER: 'Manager',
  ADMIN: 'Admin',
};

const ROLE_BADGE_VARIANTS: Record<string, 'user' | 'manager' | 'admin'> = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

export default function MeetingDetailCard({ meeting }: MeetingDetailCardProps) {
  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);

  // Use new relations if available, fallback to old
  const bookers = meeting.bookers || [];
  const sellers = meeting.sellers || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{meeting.subject}</h2>
          <MeetingStatusBadge status={meeting.status} />
        </div>
      </CardHeader>
      <CardBody>
        <dl className="space-y-6">
          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Datum</dt>
              <dd className="text-sm text-gray-900">
                {format(startDate, 'EEEE d MMMM yyyy', { locale: sv })}
              </dd>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Tid</dt>
              <dd className="text-sm text-gray-900">
                {format(startDate, 'HH:mm', { locale: sv })} -{' '}
                {format(endDate, 'HH:mm', { locale: sv })}
              </dd>
            </div>
          </div>

          {/* Bookers - NEW: Display multiple bookers */}
          {bookers.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 mb-2">
                  Bokare ({bookers.length})
                </dt>
                <dd className="space-y-2">
                  {bookers.map((booker) => (
                    <div
                      key={booker.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full bg-telink-violet flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {booker.userName.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {booker.userName}
                          </span>
                          <Badge
                            variant={ROLE_BADGE_VARIANTS[booker.user.role] || 'user'}
                            size="xs"
                          >
                            {ROLE_LABELS[booker.user.role] || booker.user.role}
                          </Badge>
                          {!booker.user.isActive && (
                            <span className="text-xs text-gray-500">(Inaktiv)</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate block">
                          {booker.user.email}
                        </span>
                      </div>

                      {/* Assignment date */}
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(booker.assignedAt), 'd MMM', { locale: sv })}
                      </span>
                    </div>
                  ))}
                </dd>
              </div>
            </div>
          )}

          {/* Sellers - NEW: Display multiple sellers */}
          {sellers.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <dt className="text-sm font-medium text-gray-500 mb-2">
                  Säljare ({sellers.length})
                </dt>
                <dd className="space-y-2">
                  {sellers.map((seller) => (
                    <div
                      key={seller.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {seller.userName.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {seller.userName}
                          </span>
                          <Badge
                            variant={ROLE_BADGE_VARIANTS[seller.user.role] || 'user'}
                            size="xs"
                          >
                            {ROLE_LABELS[seller.user.role] || seller.user.role}
                          </Badge>
                          {!seller.user.isActive && (
                            <span className="text-xs text-gray-500">(Inaktiv)</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate block">
                          {seller.user.email}
                        </span>
                      </div>

                      {/* Assignment date */}
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {format(new Date(seller.assignedAt), 'd MMM', { locale: sv })}
                      </span>
                    </div>
                  ))}
                </dd>
              </div>
            </div>
          )}

          {/* Fallback to old owner if no sellers */}
          {sellers.length === 0 && meeting.owner && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Ägare (Legacy)</dt>
                <dd className="text-sm text-gray-900">{meeting.owner.name}</dd>
                <dd className="text-xs text-gray-500">{meeting.owner.email}</dd>
              </div>
            </div>
          )}

          {/* Quality Score */}
          {meeting.qualityScore && (
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">
                  Kvalitetsbetyg
                </dt>
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
              <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
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
              <LinkIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Outlook-länk</dt>
                <dd>
                  <a
                    href={meeting.outlookLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-telink-violet hover:text-telink-violet-dark underline inline-flex items-center gap-1"
                  >
                    Öppna i Outlook
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </dd>
              </div>
            </div>
          )}
        </dl>
      </CardBody>
    </Card>
  );
}
