import { clearGestorUnlocked } from "./gestor-access";

const SESSION_KEY = "cineminha_manager_session";
const CHILD_KEY = "cineminha_active_child";
export function setManagerSession(managerId: string): void {
  sessionStorage.setItem(SESSION_KEY, managerId);
}

export function getManagerSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearManagerSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function setActiveChild(childId: string): void {
  sessionStorage.setItem(CHILD_KEY, childId);
}

export function getActiveChild(): string | null {
  return sessionStorage.getItem(CHILD_KEY);
}

export function clearActiveChild(): void {
  sessionStorage.removeItem(CHILD_KEY);
}

export function clearAllSessions(): void {
  clearManagerSession();
  clearActiveChild();
  clearGestorUnlocked();
}
