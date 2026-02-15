// API Key management — env var first, then sessionStorage fallback
const SESSION_KEY = 'adventure-engine-api-key';

/** Returns API key: env var takes priority, then user-provided sessionStorage key */
export function getApiKey(): string {
  const envKey = typeof process !== 'undefined' && process.env?.API_KEY ? process.env.API_KEY : '';
  if (envKey) return envKey;
  return sessionStorage.getItem(SESSION_KEY) || '';
}

export function setApiKey(key: string): void {
  if (key.trim()) {
    sessionStorage.setItem(SESSION_KEY, key.trim());
  } else {
    sessionStorage.removeItem(SESSION_KEY);
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

/** Returns true if user has set a session key (not env) */
export function hasSessionKey(): boolean {
  return !!sessionStorage.getItem(SESSION_KEY);
}
