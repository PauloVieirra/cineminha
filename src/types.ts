export type VideoPlatform = "youtube" | "vimeo" | "direct" | "unknown";

export interface Manager {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export interface ChildProfile {
  id: string;
  name: string;
  avatarColor: string;
  emoji: string;
  /** Perfil de adulto: busca direta no YouTube e reprodução ampliada */
  isAdult?: boolean;
  /** Vídeo em destaque no header deste perfil (gestor define) */
  featuredVideoId?: string;
  createdAt: number;
}

/** Canal importado pelo gestor (página de detalhe + vídeos vinculados). */
export interface YoutubeChannel {
  id: string;
  youtubeChannelId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  sourceUrl: string;
  childIds: string[];
  createdAt: number;
  lastSyncedAt?: number;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  platform: VideoPlatform;
  embedId?: string;
  thumbnail?: string;
  /** ID do canal no YouTube (UC...) */
  channelId?: string;
  channelTitle?: string;
  /** ID interno do YoutubeChannel importado */
  catalogChannelId?: string;
  childIds: string[];
  createdAt: number;
}

export interface WatchSession {
  id: string;
  childId: string;
  videoId: string;
  videoTitle: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds: number;
  completed: boolean;
}

export const AVATAR_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
] as const;

export const AVATAR_EMOJIS = ["🦁", "🐻", "🦊", "🐰", "🐼", "🦄", "🐸", "🦋", "🐱", "🐶"] as const;
