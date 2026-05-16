/** Persistência entre sessões do PWA (localStorage + migração única do sessionStorage). */

function migrateFromSession(key: string): void {
  try {
    const legacy = sessionStorage.getItem(key);
    if (legacy !== null && localStorage.getItem(key) === null) {
      localStorage.setItem(key, legacy);
    }
    if (legacy !== null) sessionStorage.removeItem(key);
  } catch {
    /* storage bloqueado */
  }
}

export function readAppStorage(key: string): string | null {
  migrateFromSession(key);
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeAppStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
  } catch {
    /* ignorar */
  }
}

export function removeAppStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* ignorar */
  }
}
