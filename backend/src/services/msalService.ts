import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import { config } from '../config';

/**
 * MSAL Service - Hanterar OAuth-autentisering mot Microsoft
 * Använder MSAL (Microsoft Authentication Library) för säker token-hantering
 */

// Konfigurera MSAL Client Application
const msalConfig = {
  auth: {
    clientId: config.azure.clientId,
    authority: `${config.graph.authUrl}/${config.azure.tenantId}`,
    clientSecret: config.azure.clientSecret,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

export const msalService = {
  /**
   * Genererar en authorization URL för OAuth-flödet
   * @param state - Valfri state-parameter för CSRF-skydd
   * @returns Authorization URL som användaren ska redirectas till
   */
  getAuthUrl(state?: string): string {
    const authCodeUrlParameters: AuthorizationUrlRequest = {
      scopes: config.azure.scopes,
      redirectUri: config.azure.redirectUri,
      state: state || Math.random().toString(36).substring(7),
    };

    return cca.getAuthCodeUrl(authCodeUrlParameters).then(url => url);
  },

  /**
   * Byter authorization code mot access token
   * @param code - Authorization code från OAuth callback
   * @returns Token response med access_token, refresh_token, etc.
   */
  async getTokenFromCode(code: string) {
    const tokenRequest: AuthorizationCodeRequest = {
      code,
      scopes: config.azure.scopes,
      redirectUri: config.azure.redirectUri,
    };

    try {
      const response = await cca.acquireTokenByCode(tokenRequest);
      return {
        access_token: response.accessToken,
        refresh_token: response.refreshToken || '',
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
    const refreshTokenRequest = {
      refreshToken,
      scopes: config.azure.scopes,
    };

    try {
      const response = await cca.acquireTokenByRefreshToken(refreshTokenRequest);
      return {
        access_token: response.accessToken,
        refresh_token: response.refreshToken || refreshToken,
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
