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

export function clearSession(): void {
  localStorage.removeItem('dermaquiz-session-id');
}