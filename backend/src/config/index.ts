import dotenv from 'dotenv';
import path from 'path';

// Ladda .env-filen
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Microsoft Azure AD (Graph API)
  azure: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scopes: ['Calendars.Read', 'User.Read', 'OnlineMeetings.Read'],
  },

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-this',

  // JWT Authentication
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d', // 7 days default

  // Microsoft Graph API endpoints
  graph: {
    apiUrl: 'https://graph.microsoft.com/v1.0',
    authUrl: 'https://login.microsoftonline.com',
  },
};

// Validera kritiska konfigurationer
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'AZURE_CLIENT_ID',
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Varning: Följande miljövariabler saknas: ${missing.join(', ')}`);
    console.warn('Vissa funktioner kan inte fungera korrekt.');
  }

  return missing.length === 0;
}
