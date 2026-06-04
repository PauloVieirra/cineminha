import { readAppStorage, writeAppStorage } from "./app-storage";

const AUTOPLAY_NEXT_KEY = "cineminha_autoplay_next";

/** Próximo vídeo automático ao terminar (ligado por padrão). */
export function getAutoplayNext(): boolean {
  const raw = readAppStorage(AUTOPLAY_NEXT_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function setAutoplayNext(enabled: boolean): void {
  writeAppStorage(AUTOPLAY_NEXT_KEY, enabled ? "1" : "0");
}
