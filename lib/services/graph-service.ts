import axios from 'axios';

/**
 * Microsoft Graph API Service
 * Hanterar kommunikation med Microsoft Graph för Outlook/Teams-integration
 */

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface OutlookEvent {
  id: string;
  subject?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  organizer: { emailAddress: { address: string; name: string } };
  attendees?: Array<{ emailAddress: { address: string; name: string }; type: string }>;
  onlineMeeting?: { joinUrl: string };
  bodyPreview?: string;
  iCalUId?: string;
}

export class GraphService {
  private apiUrl = 'https://graph.microsoft.com/v1.0';
  private authUrl = 'https://login.microsoftonline.com';

  /**
   * Genererar OAuth-länk för inloggning
   */
  getAuthUrl(state?: string): string {
    const clientId = process.env.AZURE_CLIENT_ID || '';
    const tenantId = process.env.AZURE_TENANT_ID || '';
    const redirectUri = process.env.AZURE_REDIRECT_URI || '';
    const scopes = ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite'];

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state: state || '',
    });

    return `${this.authUrl}/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Byter authorization code mot access token
   */
  async getTokenFromCode(code: string): Promise<TokenResponse> {
    try {
      const clientId = process.env.AZURE_CLIENT_ID || '';
      const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
      const tenantId = process.env.AZURE_TENANT_ID || '';
      const redirectUri = process.env.AZURE_REDIRECT_URI || '';

      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await axios.post<TokenResponse>(
        `${this.authUrl}/${tenantId}/oauth2/v2.0/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error getting token from code:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * Förnyar access token med refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const clientId = process.env.AZURE_CLIENT_ID || '';
      const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
      const tenantId = process.env.AZURE_TENANT_ID || '';

      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await axios.post<TokenResponse>(
        `${this.authUrl}/${tenantId}/oauth2/v2.0/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Hämtar användarens kalender-events
   */
  async getCalendarEvents(
    accessToken: string,
    startDate?: Date,
    endDate?: Date,
    top: number = 50
  ): Promise<OutlookEvent[]> {
    try {
      const params = new URLSearchParams({
        $top: top.toString(),
        $select: 'id,subject,start,end,organizer,attendees,onlineMeeting,bodyPreview,iCalUId',
        $orderby: 'start/dateTime desc',
      });

      if (startDate) {
        params.append('$filter', `start/dateTime ge '${startDate.toISOString()}'`);
      }

      if (endDate) {
        const filter = params.get('$filter');
        const dateFilter = `end/dateTime le '${endDate.toISOString()}'`;
        if (filter) {
          params.set('$filter', `${filter} and ${dateFilter}`);
        } else {
          params.append('$filter', dateFilter);
        }
      }

      const response = await axios.get(`${this.apiUrl}/me/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.value as OutlookEvent[];
    } catch (error: any) {
      console.error('Error fetching calendar events:', error.response?.data || error.message);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Hämtar ett specifikt event via event ID
   */
  async getEventById(accessToken: string, eventId: string): Promise<OutlookEvent> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/me/events/${eventId}?$select=id,subject,start,end,organizer,attendees,onlineMeeting,bodyPreview,iCalUId`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data as OutlookEvent;
    } catch (error: any) {
      console.error('Error fetching event by ID:', error.response?.data || error.message);
      throw new Error('Failed to fetch event');
    }
  }

  /**
   * Söker efter event baserat på iCalUId
   */
  async findEventByICalUId(accessToken: string, iCalUId: string): Promise<OutlookEvent | null> {
    try {
      const params = new URLSearchParams({
        $filter: `iCalUId eq '${iCalUId}'`,
        $select: 'id,subject,start,end,organizer,attendees,onlineMeeting,bodyPreview,iCalUId',
        $top: '1',
      });

      const response = await axios.get(`${this.apiUrl}/me/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const events = response.data.value as OutlookEvent[];
      return events.length > 0 ? events[0] : null;
    } catch (error: any) {
      console.error('Error finding event by iCalUId:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Söker efter event baserat på joinUrl
   * Hämtar events från de senaste 7 dagarna till 30 dagar framåt och filtrerar på joinUrl
   */
  async findEventByJoinUrl(accessToken: string, joinUrl: string): Promise<OutlookEvent | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 dagar bakåt

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dagar framåt

      // Hämta events från kalendern
      const events = await this.getCalendarEvents(accessToken, startDate, endDate, 100);

      // Filtrera events som har onlineMeeting och matchar joinUrl
      const matchingEvent = events.find(event => {
        if (!event.onlineMeeting || !event.onlineMeeting.joinUrl) {
          return false;
        }
        // Matcha exakt eller som substring
        return event.onlineMeeting.joinUrl === joinUrl ||
               event.onlineMeeting.joinUrl.includes(joinUrl) ||
               joinUrl.includes(event.onlineMeeting.joinUrl);
      });

      return matchingEvent || null;
    } catch (error: any) {
      console.error('Error finding event by joinUrl:', error);
      return null;
    }
  }

  /**
   * Parsar en Outlook/Teams-länk och extraherar event-ID eller meeting-ID
   */
  parseMeetingLink(link: string): { type: 'event' | 'teams' | 'unknown'; id: string | null } {
    // Outlook event link: https://outlook.office365.com/calendar/item/[event-id]
    const outlookEventMatch = link.match(/outlook\.office365\.com\/calendar\/item\/([^?/]+)/i);
    if (outlookEventMatch) {
      return { type: 'event', id: outlookEventMatch[1] };
    }

    // Teams meeting link: https://teams.microsoft.com/l/meetup-join/...
    const teamsMatch = link.match(/teams\.microsoft\.com\/l\/meetup-join\/([^?/]+)/i);
    if (teamsMatch) {
      return { type: 'teams', id: teamsMatch[1] };
    }

    // Outlook web link with itemid parameter
    const itemIdMatch = link.match(/[?&]itemid=([^&]+)/i);
    if (itemIdMatch) {
      return { type: 'event', id: decodeURIComponent(itemIdMatch[1]) };
    }

    return { type: 'unknown', id: null };
  }

  /**
   * Hämtar användarinformation
   */
  async getUserInfo(accessToken: string): Promise<{ id: string; email: string; name: string }> {
    try {
      const response = await axios.get(`${this.apiUrl}/me?$select=id,mail,displayName`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.id,
        email: response.data.mail || response.data.userPrincipalName,
        name: response.data.displayName,
      };
    } catch (error: any) {
      console.error('Error fetching user info:', error.response?.data || error.message);
      throw new Error('Failed to fetch user info');
    }
  }
}

export const graphService = new GraphService();
