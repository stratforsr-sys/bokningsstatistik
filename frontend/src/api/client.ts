import type {
  Meeting,
  StatsSummary,
  UpdateMeetingStatusRequest,
  MeetingsQueryParams,
  StatsQueryParams,
  User,
  LoginCredentials,
  AuthResponse,
  InviteCompleteRequest,
  InviteRequest,
  InviteResponse,
} from '../types';

// API Base URL - använd relativa URLs i utveckling (via Vite proxy)
// I produktion serveras frontend från samma port som backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Helper function för att bygga query string från params
 */
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Helper function för att hantera API-fel
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
}

/**
 * API Client för Telink Bokningsstatistik
 */
export const api = {
  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  /**
   * Logga in med email och lösenord
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Viktigt för cookies
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  /**
   * Logga ut
   * POST /auth/logout
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  /**
   * Hämta inloggad användare
   * GET /auth/me
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ success: boolean; user: User }>(response);
    return data.user;
  },

  /**
   * Slutför invite och skapa konto
   * POST /auth/invite/complete
   */
  async completeInvite(data: InviteCompleteRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/invite/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  // ============================================================================
  // USER MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Hämta alla användare
   * GET /api/users
   */
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ success: boolean; users: User[] }>(response);
    return data.users;
  },

  /**
   * Bjud in ny användare (ADMIN only)
   * POST /api/users/invite
   */
  async inviteUser(data: InviteRequest): Promise<InviteResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<InviteResponse>(response);
  },

  /**
   * Uppdatera användare (ADMIN only)
   * PATCH /api/users/:id
   */
  async updateUser(
    id: string,
    data: { name?: string; email?: string; role?: string }
  ): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ success: boolean; user: User }>(response);
    return result.user;
  },

  /**
   * Ta bort användare (ADMIN only)
   * DELETE /api/users/:id
   */
  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await handleResponse<{ success: boolean; message: string }>(response);
  },

  // ============================================================================
  // MEETINGS & STATS ENDPOINTS
  // ============================================================================
  /**
   * Hämta statistik-sammanfattning
   * GET /api/stats/summary?user_id=...&period=...
   */
  async getStatsSummary(params: StatsQueryParams): Promise<StatsSummary> {
    const queryString = buildQueryString(params);
    const response = await fetch(`${API_BASE_URL}/api/stats/summary${queryString}`);
    const data = await handleResponse<{ success: boolean; stats: StatsSummary }>(response);
    return data.stats;
  },

  /**
   * Hämta alla statistik-perioder samtidigt (parallella anrop)
   */
  async getAllStats(userId?: string): Promise<{
    today: StatsSummary;
    week: StatsSummary;
    month: StatsSummary;
    total: StatsSummary;
  }> {
    const [today, week, month, total] = await Promise.all([
      api.getStatsSummary({ period: 'today', user_id: userId }),
      api.getStatsSummary({ period: 'week', user_id: userId }),
      api.getStatsSummary({ period: 'month', user_id: userId }),
      api.getStatsSummary({ period: 'total', user_id: userId }),
    ]);

    return { today, week, month, total };
  },

  /**
   * Hämta lista med möten
   * GET /api/meetings?user_id=...&from=...&to=...
   */
  async getMeetings(params?: MeetingsQueryParams): Promise<Meeting[]> {
    const queryString = params ? buildQueryString(params) : '';
    const response = await fetch(`${API_BASE_URL}/api/meetings${queryString}`, {
      credentials: 'include', // Lägg till credentials
    });
    const data = await handleResponse<{ success: boolean; meetings: Meeting[] }>(response);
    return data.meetings;
  },

  /**
   * Hämta ett specifikt möte
   * GET /api/meetings/:id
   */
  async getMeeting(id: string): Promise<Meeting> {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`);
    const data = await handleResponse<{ success: boolean; meeting: Meeting }>(response);
    return data.meeting;
  },

  /**
   * Uppdatera mötets status
   * PATCH /api/meetings/:id/status
   */
  async updateMeetingStatus(
    id: string,
    data: UpdateMeetingStatusRequest
  ): Promise<Meeting> {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ success: boolean; meeting: Meeting }>(response);
    return result.meeting;
  },

  /**
   * Skapa möte från Outlook/Teams-länk
   * POST /api/meetings/from-link
   */
  async createMeetingFromLink(link: string): Promise<Meeting> {
    const response = await fetch(`${API_BASE_URL}/api/meetings/from-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link }),
    });
    const result = await handleResponse<{ success: boolean; meeting: Meeting }>(response);
    return result.meeting;
  },

  /**
   * Skapa nytt möte manuellt
   * POST /api/meetings
   */
  async createMeeting(data: {
    subject: string;
    startTime: string;
    endTime?: string;
    bookerId?: string;
    ownerId?: string;
    organizerEmail?: string;
    joinUrl?: string;
    notes?: string;
    status?: string;
  }): Promise<Meeting> {
    const response = await fetch(`${API_BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ success: boolean; meeting: Meeting }>(response);
    return result.meeting;
  },

  /**
   * Uppdatera möte (generell uppdatering)
   * PATCH /api/meetings/:id
   */
  async updateMeeting(
    id: string,
    data: {
      subject?: string;
      startTime?: string;
      endTime?: string;
      organizerEmail?: string;
      ownerId?: string;
      notes?: string;
      joinUrl?: string;
    }
  ): Promise<Meeting> {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ success: boolean; meeting: Meeting }>(response);
    return result.meeting;
  },

  /**
   * Ta bort möte
   * DELETE /api/meetings/:id
   */
  async deleteMeeting(id: string, hardDelete: boolean = false): Promise<void> {
    const queryString = hardDelete ? '?hardDelete=true' : '';
    const response = await fetch(`${API_BASE_URL}/api/meetings/${id}${queryString}`, {
      method: 'DELETE',
    });
    await handleResponse<{ success: boolean; message: string }>(response);
  },
};
