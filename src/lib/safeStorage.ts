/** localStorage can throw (private mode, quota, disabled storage) — never let that kill the app shell. */
export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — app still runs in memory */
  }
}
