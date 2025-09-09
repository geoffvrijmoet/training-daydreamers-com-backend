import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { connectDB } from './db';
import GoogleCalendarConnectionModel, { IGoogleCalendarConnection } from '@/models/GoogleCalendarConnection';
import SystemGoogleCalendarConnectionModel, { ISystemGoogleCalendarConnection } from '@/models/SystemGoogleCalendarConnection';

// Type definitions for Google Calendar API responses
// interface GoogleUserInfo {
//   id: string;
//   email: string;
// }

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:7777/api/google-calendar/auth/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
];

export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function createSystemOAuth2Client(): OAuth2Client {
  const systemRedirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:7777'}/api/system-google-calendar/auth/callback`;
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    systemRedirectUri
  );
}

export function generateAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

export function generateSystemAuthUrl(): string {
  const oauth2Client = createSystemOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  googleUserId: string;
  googleEmail: string;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get access and refresh tokens');
  }
  oauth2Client.setCredentials(tokens);
  // Fetch user info
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  if (!userInfo.data.id || !userInfo.data.email) {
    throw new Error('Failed to fetch Google user info');
  }
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600000,
    googleUserId: userInfo.data.id,
    googleEmail: userInfo.data.email
  };
}

export async function exchangeCodeForSystemTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  googleUserId: string;
  googleEmail: string;
}> {
  const oauth2Client = createSystemOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get access and refresh tokens');
  }
  oauth2Client.setCredentials(tokens);
  // Fetch user info
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  if (!userInfo.data.id || !userInfo.data.email) {
    throw new Error('Failed to fetch Google user info');
  }
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600000,
    googleUserId: userInfo.data.id,
    googleEmail: userInfo.data.email
  };
}

export async function getAllConnectionsForUser(userId: string): Promise<IGoogleCalendarConnection[]> {
  await connectDB();
  return GoogleCalendarConnectionModel.find({ userId, isActive: true }).exec();
}

export async function getValidAccessToken(userId: string, googleUserId: string): Promise<string> {
  await connectDB();
  const connection = await GoogleCalendarConnectionModel.findOne({ userId, googleUserId, isActive: true });
  if (!connection) {
    throw new Error('No active Google Calendar connection found');
  }
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiry.getTime()
  });
  if (connection.tokenExpiry <= new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      connection.accessToken = credentials.access_token!;
      connection.tokenExpiry = new Date(credentials.expiry_date!);
      await connection.save();
      return credentials.access_token!;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // Check if this is an invalid_grant error (token expired or revoked)
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        console.log(`🔄 Refresh token expired for user ${userId}, Google account ${googleUserId}. Marking connection as inactive.`);
        
        // Mark the connection as inactive so it won't be used again
        connection.isActive = false;
        await connection.save();
        
        throw new Error('Google Calendar connection expired. Please reconnect your Google account.');
      }
      
      throw new Error('Failed to refresh access token');
    }
  }
  return connection.accessToken;
}

export async function getUserCalendars(userId: string): Promise<Array<{
  googleUserId: string;
  googleEmail: string;
  calendars: Array<{
    id: string;
    summary: string;
    primary?: boolean;
    accessRole: string;
  }>;
}>> {
  const connections = await getAllConnectionsForUser(userId);
  const results: Array<{
    googleUserId: string;
    googleEmail: string;
    calendars: Array<{
      id: string;
      summary: string;
      primary?: boolean;
      accessRole: string;
    }>;
  }> = [];
  
  for (const conn of connections) {
    try {
      const accessToken = await getValidAccessToken(userId, conn.googleUserId);
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.calendarList.list();
      const calendars = (response.data.items || []).map((cal: calendar_v3.Schema$CalendarListEntry) => ({
        id: cal.id || '',
        summary: cal.summary || 'Untitled Calendar',
        primary: !!cal.primary,
        accessRole: cal.accessRole || 'none'
      }));
      results.push({
        googleUserId: conn.googleUserId,
        googleEmail: conn.googleEmail,
        calendars
      });
    } catch (error) {
      console.error(`Failed to fetch calendars for Google account ${conn.googleEmail}:`, error);
      // Continue with other connections even if one fails
    }
  }
  return results;
}

export async function getCalendarEvents(
  userId: string,
  startDate: Date,
  endDate: Date,
  calendarSelections?: Array<{ googleUserId: string; calendarIds: string[] }>
): Promise<Array<{
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string | null;
  location: string | null;
  calendarId: string;
  calendarSummary: string;
  googleUserId: string;
  googleEmail: string;
}>> {
  console.log('🔍 getCalendarEvents called:', {
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    calendarSelections
  });

  const connections = await getAllConnectionsForUser(userId);
  console.log('📊 Found connections:', connections.map(c => ({
    googleUserId: c.googleUserId,
    googleEmail: c.googleEmail,
    calendarIds: c.calendarIds,
    isActive: c.isActive
  })));

  const allEvents: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    description: string | null;
    location: string | null;
    calendarId: string;
    calendarSummary: string;
    googleUserId: string;
    googleEmail: string;
  }> = [];

  for (const conn of connections) {
    let calendarIds = conn.calendarIds;
    if (calendarSelections) {
      const found = calendarSelections.find(sel => sel.googleUserId === conn.googleUserId);
      if (found) calendarIds = found.calendarIds;
      else continue;
    }
    
    console.log(`📅 Processing account ${conn.googleEmail}:`, {
      calendarIds,
      calendarCount: calendarIds?.length || 0
    });

    if (!calendarIds || calendarIds.length === 0) {
      console.log(`⚠️ No calendars selected for ${conn.googleEmail}, skipping`);
      continue;
    }

    try {
      const accessToken = await getValidAccessToken(userId, conn.googleUserId);
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      for (const calendarId of calendarIds) {
        console.log(`🔍 Fetching events from calendar: ${calendarId} (${conn.googleEmail})`);
        
        try {
          const response = await calendar.events.list({
            calendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });

          const rawEvents = response.data.items || [];
          console.log(`📋 Raw events from ${calendarId}:`, rawEvents.length, rawEvents.map(e => ({
            id: e.id,
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date
          })));

          const events = rawEvents.map((event: calendar_v3.Schema$Event) => {
            if (event.start && event.end) {
              return {
                id: event.id || '',
                title: event.summary || 'Untitled Event',
                start: new Date(event.start.dateTime || event.start.date || ''),
                end: new Date(event.end.dateTime || event.end.date || ''),
                description: event.description ?? null,
                location: event.location ?? null,
                calendarId,
                calendarSummary: response.data.summary || 'Unknown Calendar',
                googleUserId: conn.googleUserId,
                googleEmail: conn.googleEmail
              };
            }
            return null;
          }).filter((e): e is {
            id: string;
            title: string;
            start: Date;
            end: Date;
            description: string | null;
            location: string | null;
            calendarId: string;
            calendarSummary: string;
            googleUserId: string;
            googleEmail: string;
          } => e !== null);

          console.log(`✅ Processed events from ${calendarId}:`, events.length);
          allEvents.push(...events);
        } catch (error) {
          console.error(`❌ Failed to fetch events from calendar ${calendarId}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to get access token for Google account ${conn.googleEmail}:`, error);
      // Continue with other connections even if one fails
    }
  }

  console.log('🎉 Total events found:', allEvents.length);
  return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function saveCalendarConnection(
  userId: string,
  googleUserId: string,
  googleEmail: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: Date,
  calendarIds: string[] = []
): Promise<IGoogleCalendarConnection> {
  await connectDB();
  const connection = await GoogleCalendarConnectionModel.findOneAndUpdate(
    { userId, googleUserId },
    {
      googleEmail,
      accessToken,
      refreshToken,
      tokenExpiry: expiryDate,
      calendarIds,
      isActive: true,
      lastSyncAt: new Date()
    },
    { upsert: true, new: true }
  );
  return connection;
}

export async function updateCalendarPreferences(
  userId: string,
  googleUserId: string,
  calendarIds: string[]
): Promise<IGoogleCalendarConnection> {
  await connectDB();
  const connection = await GoogleCalendarConnectionModel.findOneAndUpdate(
    { userId, googleUserId },
    { calendarIds, lastSyncAt: new Date() },
    { new: true }
  );
  if (!connection) {
    throw new Error('No Google Calendar connection found');
  }
  return connection;
}

export async function disconnectCalendar(userId: string, googleUserId: string): Promise<void> {
  await connectDB();
  await GoogleCalendarConnectionModel.findOneAndUpdate(
    { userId, googleUserId },
    { isActive: false }
  );
}

// System-level Google Calendar functions (for public portal access)

export async function getSystemGoogleCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<Array<{
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string | null;
  location: string | null;
  calendarId: string;
  calendarSummary: string;
  googleUserId: string;
  googleEmail: string;
}>> {
  console.log('🔍 getSystemGoogleCalendarEvents called:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  await connectDB();
  const connections = await SystemGoogleCalendarConnectionModel.find({ isActive: true });
  console.log('📊 Found system connections:', connections.map(c => ({
    connectionName: c.connectionName,
    googleUserId: c.googleUserId,
    googleEmail: c.googleEmail,
    calendarIds: c.calendarIds,
    isActive: c.isActive
  })));

  const allEvents: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    description: string | null;
    location: string | null;
    calendarId: string;
    calendarSummary: string;
    googleUserId: string;
    googleEmail: string;
  }> = [];

  for (const conn of connections) {
    console.log(`📅 Processing system account ${conn.googleEmail}:`, {
      calendarIds: conn.calendarIds,
      calendarCount: conn.calendarIds?.length || 0
    });

    if (!conn.calendarIds || conn.calendarIds.length === 0) {
      console.log(`⚠️ No calendars selected for ${conn.googleEmail}, skipping`);
      continue;
    }

    try {
      const accessToken = await getSystemValidAccessToken(conn.googleUserId);
      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      for (const calendarId of conn.calendarIds) {
        console.log(`🔍 Fetching system events from calendar: ${calendarId} (${conn.googleEmail})`);
        
        try {
          const response = await calendar.events.list({
            calendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });

          const rawEvents = response.data.items || [];
          console.log(`📋 Raw system events from ${calendarId}:`, rawEvents.length, rawEvents.map(e => ({
            id: e.id,
            summary: e.summary,
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date
          })));

          const events = rawEvents.map((event: calendar_v3.Schema$Event) => {
            if (event.start && event.end) {
              return {
                id: event.id || '',
                title: event.summary || 'Unavailable',
                start: new Date(event.start.dateTime || event.start.date || ''),
                end: new Date(event.end.dateTime || event.end.date || ''),
                description: event.description ?? null,
                location: event.location ?? null,
                calendarId,
                calendarSummary: response.data.summary || 'Unknown Calendar',
                googleUserId: conn.googleUserId,
                googleEmail: conn.googleEmail
              };
            }
            return null;
          }).filter((e): e is {
            id: string;
            title: string;
            start: Date;
            end: Date;
            description: string | null;
            location: string | null;
            calendarId: string;
            calendarSummary: string;
            googleUserId: string;
            googleEmail: string;
          } => e !== null);

          console.log(`✅ Processed system events from ${calendarId}:`, events.length);
          allEvents.push(...events);
        } catch (error) {
          console.error(`❌ Failed to fetch system events from calendar ${calendarId}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to get access token for system Google account ${conn.googleEmail}:`, error);
      // Continue with other connections even if one fails
    }
  }

  console.log('🎉 Total system events found:', allEvents.length);
  return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function getSystemValidAccessToken(googleUserId: string): Promise<string> {
  await connectDB();
  const connection = await SystemGoogleCalendarConnectionModel.findOne({ googleUserId, isActive: true });
  if (!connection) {
    throw new Error('No active system Google Calendar connection found');
  }
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiry.getTime()
  });
  if (connection.tokenExpiry <= new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      connection.accessToken = credentials.access_token!;
      connection.tokenExpiry = new Date(credentials.expiry_date!);
      await connection.save();
      return credentials.access_token!;
    } catch (error) {
      console.error('Failed to refresh system token:', error);
      
      // Check if this is an invalid_grant error (token expired or revoked)
      if (error instanceof Error && error.message.includes('invalid_grant')) {
        console.log(`🔄 System refresh token expired for Google account ${googleUserId}. Marking connection as inactive.`);
        
        // Mark the connection as inactive so it won't be used again
        connection.isActive = false;
        await connection.save();
        
        throw new Error('System Google Calendar connection expired. Please reconnect the system calendar.');
      }
      
      throw new Error('Failed to refresh system access token');
    }
  }
  return connection.accessToken;
}

export async function saveSystemCalendarConnection(
  connectionName: string,
  googleUserId: string,
  googleEmail: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: Date,
  calendarIds: string[] = []
): Promise<ISystemGoogleCalendarConnection> {
  await connectDB();
  const connection = await SystemGoogleCalendarConnectionModel.findOneAndUpdate(
    { googleUserId },
    {
      connectionName,
      googleEmail,
      accessToken,
      refreshToken,
      tokenExpiry: expiryDate,
      calendarIds,
      isActive: true,
      lastSyncAt: new Date()
    },
    { upsert: true, new: true }
  );
  return connection;
}

export async function getSystemCalendarConnections(): Promise<ISystemGoogleCalendarConnection[]> {
  await connectDB();
  console.log('🔍 Querying for system calendar connections...');
  const connections = await SystemGoogleCalendarConnectionModel.find({ isActive: true }).exec();
  console.log(`📊 Found ${connections.length} system connections:`, connections.map(c => ({ 
    id: c._id, 
    email: c.googleEmail, 
    name: c.connectionName,
    calendars: c.calendarIds.length 
  })));
  return connections;
}

export async function updateSystemCalendarPreferences(
  googleUserId: string,
  calendarIds: string[]
): Promise<ISystemGoogleCalendarConnection> {
  await connectDB();
  const connection = await SystemGoogleCalendarConnectionModel.findOneAndUpdate(
    { googleUserId },
    { calendarIds, lastSyncAt: new Date() },
    { new: true }
  );
  if (!connection) {
    throw new Error('No system Google Calendar connection found');
  }
  return connection;
}

export async function disconnectSystemCalendar(googleUserId: string): Promise<void> {
  await connectDB();
  await SystemGoogleCalendarConnectionModel.findOneAndUpdate(
    { googleUserId },
    { isActive: false }
  );
} 