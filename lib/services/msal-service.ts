import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';

/**
 * MSAL Service - Hanterar OAuth-autentisering mot Microsoft
 * Använder MSAL (Microsoft Authentication Library) för säker token-hantering
 *
 * OBS: Denna service är optional. Om Azure credentials inte är konfigurerade,
 * kommer applikationen fortfarande fungera men utan Microsoft Graph API integration.
 */

// Lazy initialization - skapar endast MSAL client när den faktiskt används
let cca: ConfidentialClientApplication | null = null;

function getClient(): ConfidentialClientApplication {
  if (!cca) {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    // Kontrollera om Azure credentials finns
    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Azure credentials are not configured. Please set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables.');
    }

    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    };

    cca = new ConfidentialClientApplication(msalConfig);
  }
  return cca;
}

export const msalService = {
  /**
   * Genererar en authorization URL för OAuth-flödet
   * @param state - Valfri state-parameter för CSRF-skydd
   * @returns Authorization URL som användaren ska redirectas till
   */
  async getAuthUrl(state?: string): Promise<string> {
    const scopes = ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite'];
    const redirectUri = process.env.AZURE_REDIRECT_URI || '';

    const authCodeUrlParameters: AuthorizationUrlRequest = {
      scopes,
      redirectUri,
      state: state || Math.random().toString(36).substring(7),
    };

    return await getClient().getAuthCodeUrl(authCodeUrlParameters);
  },

  /**
   * Byter authorization code mot access token
   * @param code - Authorization code från OAuth callback
   * @returns Token response med access_token, refresh_token, etc.
   */
  async getTokenFromCode(code: string) {
    const scopes = ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite'];
    const redirectUri = process.env.AZURE_REDIRECT_URI || '';

    const tokenRequest: AuthorizationCodeRequest = {
      code,
      scopes,
      redirectUri,
    };

    try {
      const response = await getClient().acquireTokenByCode(tokenRequest);
      if (!response) {
        throw new Error('No response from token acquisition');
      }
      return {
        access_token: response.accessToken,
        refresh_token: '', // MSAL does not expose refresh token
        expires_in: response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : 3600,
        token_type: response.tokenType,
      };
    } catch (error: any) {
      console.error('Error acquiring token from code:', error);
      throw new Error(`Failed to acquire token: ${error.message}`);
    }
  },

  /**
   * Förnyar access token med en refresh token
   * @param refreshToken - Refresh token från tidigare autentisering
   * @returns Token response med ny access_token
   */
  async refreshAccessToken(refreshToken: string) {
    const scopes = ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite'];

    const refreshTokenRequest = {
      refreshToken,
      scopes,
    };

    try {
      const response = await getClient().acquireTokenByRefreshToken(refreshTokenRequest);
      if (!response) {
        throw new Error('No response from token refresh');
      }
      return {
        access_token: response.accessToken,
        refresh_token: refreshToken, // Use the original refresh token
        expires_in: response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : 3600,
        token_type: response.tokenType,
      };
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  },

  /**
   * Hämtar en giltig access token för en användare
   * Om token har gått ut, förnyas den automatiskt med refresh token
   * @param refreshToken - Användarens refresh token
   * @returns Giltig access token
   */
  async getValidAccessToken(refreshToken: string): Promise<string> {
    try {
      const tokenResponse = await this.refreshAccessToken(refreshToken);
      return tokenResponse.access_token;
    } catch (error) {
      throw new Error('Could not get valid access token. User may need to re-authenticate.');
    }
  },
};
