// Session management utility
export function getSessionId(): string {
  const STORAGE_KEY = 'dermaquiz-session-id';
  
  // Try to get existing session ID from localStorage
  let sessionId = localStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

// Initialize session by calling the session endpoint
export async function initializeSession(): Promise<{ user: any; sessionId: string }> {
  try {
    const response = await fetch('/api/user/session', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize session');
    }
    
    const data = await response.json();
    
    // If we got a sessionId from the server, store it
    if (data.sessionId) {
      localStorage.setItem('dermaquiz-session-id', data.sessionId);
    }
    
    return data;
  } catch (error) {
    console.error('Session initialization error:', error);
    // Fall back to local session ID generation
    const sessionId = getSessionId();
    return { user: null, sessionId };
  }
}

export function clearSession(): void {
  localStorage.removeItem('dermaquiz-session-id');
}