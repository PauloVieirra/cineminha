import { clearGestorUnlocked } from "./gestor-access";
import { readAppStorage, removeAppStorage, writeAppStorage } from "./app-storage";

const SESSION_KEY = "cineminha_manager_session";
const CHILD_KEY = "cineminha_active_child";

export function setManagerSession(managerId: string): void {
  writeAppStorage(SESSION_KEY, managerId);
}

export function getManagerSession(): string | null {
  return readAppStorage(SESSION_KEY);
}

export function clearManagerSession(): void {
  removeAppStorage(SESSION_KEY);
}

export function setActiveChild(childId: string): void {
  writeAppStorage(CHILD_KEY, childId);
}

export function getActiveChild(): string | null {
  return readAppStorage(CHILD_KEY);
}

export function clearActiveChild(): void {
  removeAppStorage(CHILD_KEY);
}

export function clearAllSessions(): void {
  clearManagerSession();
  clearActiveChild();
  clearGestorUnlocked();
}
