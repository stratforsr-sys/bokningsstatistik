// TypeScript-typer för backend

export interface MeetingCreateInput {
  outlookEventId?: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  subject?: string;
  organizerEmail: string;
  attendees?: string; // JSON string
  joinUrl?: string;
  bodyPreview?: string;
  bookerId: string;
  ownerId: string;
}

export interface MeetingUpdateInput {
  status?: 'BOOKED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELED' | 'RESCHEDULED';
  statusReason?: string;
  qualityScore?: number; // 1-5
  notes?: string;
}

export interface StatsQuery {
  userId?: string;
  period: 'today' | 'week' | 'month' | 'total';
  startDate?: Date;
  endDate?: Date;
}

export interface StatsResponse {
  period: 'today' | 'week' | 'month' | 'total';
  user_id: string | null;
  dagens_bokningar: number;
  veckans_bokningar: number;
  manadens_bokningar: number;
  total_bokningar: number;
  avbokningar: number;
  ombokningar: number;
  noshows: number;
  genomforda: number;
  show_rate: number;
  no_show_rate: number;
  kvalitet_genomsnitt: number;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  attendees?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    type: string;
  }>;
  onlineMeeting?: {
    joinUrl: string;
  };
  bodyPreview?: string;
  iCalUId?: string;
}
