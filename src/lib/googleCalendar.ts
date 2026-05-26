import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App gracefully
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Calendar scopes
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar');

provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache variables
let cachedToken: string | null = null;

// Initial listener
export const initCalendarAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedToken) {
        onSuccess(user, cachedToken);
      } else {
        // If logged in but token is not cached (e.g. page refreshed), we must re-authenticate to obtain a fresh access token
        onFailure();
      }
    } else {
      cachedToken = null;
      onFailure();
    }
  });
};

// Sign in with Google Calendar permission
export const signInGoogleCalendar = async (): Promise<{ user: User; token: string } | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    
    if (!token) {
      throw new Error('Não foi possível obter o Access Token do Google.');
    }
    
    cachedToken = token;
    return { user: result.user, token };
  } catch (error) {
    console.error('Erro no login do Google Calendar:', error);
    throw error;
  }
};

// Log out Google
export const logoutGoogleCalendar = async () => {
  await signOut(auth);
  cachedToken = null;
};

// Fetch meetings list from Google Calendar primary calendar
export const fetchGoogleCalendarEvents = async (accessToken: string): Promise<any[]> => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=15&orderBy=startTime&singleEvents=true&timeMin=' + 
      new Date().toISOString(),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Falha ao buscar eventos do Google Calendar.');
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Erro buscando eventos do Google:', error);
    throw error;
  }
};

// Insert a new meeting into Google Calendar
export const insertGoogleCalendarEvent = async (
  accessToken: string,
  eventData: {
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    durationMinutes?: number;
  }
): Promise<any> => {
  try {
    // Construct standard ISO date string
    const startDateTime = `${eventData.date}T${eventData.time}:00`;
    
    // Parse start date
    const start = new Date(startDateTime);
    // Find timezone offset in America/Sao_Paulo (or localize browser offset)
    const duration = eventData.durationMinutes || 60;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // Construct request body
    const body = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
      }
    };
    
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao criar evento: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro cadastrando evento no Google Calendar:', error);
    throw error;
  }
};
