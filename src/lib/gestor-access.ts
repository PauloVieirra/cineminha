const GESTOR_UNLOCK_KEY = "cineminha_gestor_unlocked";
const UNLOCK_MS = 30 * 60 * 1000;

export function setGestorUnlocked(): void {
  sessionStorage.setItem(GESTOR_UNLOCK_KEY, String(Date.now() + UNLOCK_MS));
}

export function clearGestorUnlocked(): void {
  sessionStorage.removeItem(GESTOR_UNLOCK_KEY);
}

export function isGestorUnlocked(): boolean {
  const raw = sessionStorage.getItem(GESTOR_UNLOCK_KEY);
  if (!raw) return false;
  const expires = Number(raw);
  if (Number.isNaN(expires) || Date.now() > expires) {
    sessionStorage.removeItem(GESTOR_UNLOCK_KEY);
    return false;
  }
  return true;
}
