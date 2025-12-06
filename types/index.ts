import { UserRole, MeetingStatus, StatusReason } from '@prisma/client';

// Re-export Prisma enums
export { UserRole, MeetingStatus, StatusReason };

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Meeting types
export interface Meeting {
  id: string;
  outlookEventId?: string | null;
  bookingDate: string | Date;
  startTime: string | Date;
  endTime: string | Date;
  subject?: string | null;
  organizerEmail: string;
  attendees?: string | null;
  joinUrl?: string | null;
  bodyPreview?: string | null;
  bookerId?: string | null;
  bookerName: string;
  ownerId?: string | null;
  ownerName: string;
  status: MeetingStatus;
  statusReason?: StatusReason | null;
  qualityScore?: number | null;
  notes?: string | null;
  createdAt: string | Date;
  lastUpdated: string | Date;
  booker?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  owner?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
}

// Stats types
export interface StatsSummary {
  dagens_bokningar?: number;
  veckans_bokningar?: number;
  manadens_bokningar?: number;
  total_bokningar?: number;
  avbokningar?: number;
  ombokningar?: number;
  noshows?: number;
  genomforda?: number;
  show_rate?: number;
  no_show_rate?: number;
  kvalitet_genomsnitt?: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

// Invite types
export interface InviteRequest {
  email: string;
  role: UserRole;
}

export interface InviteResponse {
  success: boolean;
  message: string;
  inviteUrl?: string;
  expiresAt?: string;
}

export interface InviteCompleteRequest {
  token: string;
  name: string;
  password: string;
}

// Update requests
export interface UpdateMeetingStatusRequest {
  status: MeetingStatus;
  statusReason?: StatusReason;
  qualityScore?: number;
  notes?: string;
}

// Query params
export interface MeetingsQueryParams {
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
  query?: string;
  limit?: number;
  offset?: number;
  user_id?: string;
}

export interface StatsQueryParams {
  userId?: string;
  period?: 'today' | 'week' | 'month' | 'total';
  startDate?: string;
  endDate?: string;
}
