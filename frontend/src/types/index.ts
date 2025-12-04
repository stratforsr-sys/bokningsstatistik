// User Roles
export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface InviteCompleteRequest {
  token: string;
  name: string;
  password: string;
}

export interface InviteRequest {
  email: string;
  role: UserRole;
}

export interface InviteResponse {
  success: boolean;
  message: string;
  invite: {
    id: string;
    email: string;
    role: UserRole;
    expiresAt: string;
  };
  inviteUrl: string;
}

// Meeting Status Types
export type MeetingStatus =
  | 'BOOKED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELED'
  | 'RESCHEDULED';

export type StatusReason = string; // Enum from backend

// User nested in Meeting (alias to User)
export interface MeetingUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Meeting Interface (camelCase to match Prisma/backend)
export interface Meeting {
  id: string;
  outlookEventId?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  organizerEmail?: string;
  bookerId?: string;
  ownerId?: string;
  status: MeetingStatus;
  statusReason?: string;
  qualityScore?: number;
  lastUpdated: string;
  subject?: string;
  location?: string;
  notes?: string;
  joinUrl?: string;
  booker?: MeetingUser;
  owner?: MeetingUser;
}

// Statistics Summary
export interface StatsSummary {
  period: 'today' | 'week' | 'month' | 'total';
  user_id?: string;
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

// API Request/Response Types
export interface UpdateMeetingStatusRequest {
  status: MeetingStatus;
  status_reason?: string;
  quality_score?: number;
}

export interface MeetingsQueryParams {
  user_id?: string;
  from?: string;
  to?: string;
  status?: MeetingStatus;
  query?: string; // Söksträng för textbaserad sökning
  limit?: number;
  offset?: number;
}

export interface StatsQueryParams {
  user_id?: string;
  period: 'today' | 'week' | 'month' | 'total';
}

// UI Component Props Types
export interface StatsCardProps {
  title: string;
  period: string;
  bokningar: number;
  avbokningar: number;
  ombokningar: number;
  noshows: number;
  genomforda: number;
  showRate: number;
  noShowRate: number;
  kvalitet: number;
  isLoading?: boolean;
}

export interface FilterState {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: MeetingStatus;
}
