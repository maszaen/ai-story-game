// API Key management — env var first, then localStorage/sessionStorage fallback
const SESSION_KEY = 'adventure-engine-api-key';
const PERSIST_KEY = 'adventure-engine-api-key-persistent';

/** Returns API key: env var takes priority, then persistent (localStorage), then session (sessionStorage) */
export function getApiKey(): string {
  const envKey = typeof process !== 'undefined' && process.env?.API_KEY ? process.env.API_KEY : '';
  if (envKey) return envKey;
  // Check persistent storage first, then session
  return localStorage.getItem(PERSIST_KEY) || sessionStorage.getItem(SESSION_KEY) || '';
}

export function setApiKey(key: string, persist = false): void {
  if (key.trim()) {
    if (persist) {
      localStorage.setItem(PERSIST_KEY, key.trim());
      sessionStorage.removeItem(SESSION_KEY); // clean up session copy
    } else {
      sessionStorage.setItem(SESSION_KEY, key.trim());
      localStorage.removeItem(PERSIST_KEY); // clean up persistent copy
    }
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
  }
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

/** Returns true if API key comes from build-time env var */
export function isEnvKey(): boolean {
  const envKey = typeof process !== 'undefined' && process.env?.API_KEY ? process.env.API_KEY : '';
  return !!envKey;
}

/** Returns true if user has set a key (session or persistent, not env) */
export function hasSessionKey(): boolean {
  return !!localStorage.getItem(PERSIST_KEY) || !!sessionStorage.getItem(SESSION_KEY);
}

/** Migrate key between storage types when persistence setting changes */
export function migratePersistence(persist: boolean): void {
  if (persist) {
    // Move from session to persistent
    const sessionKey = sessionStorage.getItem(SESSION_KEY);
    if (sessionKey) {
      localStorage.setItem(PERSIST_KEY, sessionKey);
      sessionStorage.removeItem(SESSION_KEY);
    }
  } else {
    // Move from persistent to session
    const persistedKey = localStorage.getItem(PERSIST_KEY);
    if (persistedKey) {
      sessionStorage.setItem(SESSION_KEY, persistedKey);
      localStorage.removeItem(PERSIST_KEY);
    }
  }
}
