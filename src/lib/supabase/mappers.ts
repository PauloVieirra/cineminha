import type { ChildProfile, Manager, Video, WatchSession, YoutubeChannel } from "../../types";

export type ChildRow = {
  id: string;
  manager_id: string;
  name: string;
  avatar_color: string;
  emoji: string;
  featured_video_id: string | null;
  created_at: string;
};

export type ManagerRow = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export type VideoRow = {
  id: string;
  manager_id: string;
  title: string;
  url: string;
  platform: string;
  embed_id: string | null;
  thumbnail: string | null;
  channel_id: string | null;
  channel_title: string | null;
  catalog_channel_id: string | null;
  created_at: string;
};

export type ChannelRow = {
  id: string;
  manager_id: string;
  youtube_channel_id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  source_url: string;
  created_at: string;
  last_synced_at: string | null;
};

export type WatchSessionRow = {
  id: string;
  child_id: string;
  video_id: string;
  video_title: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  completed: boolean;
};

export function tsToMs(iso: string): number {
  return new Date(iso).getTime();
}

export function msToIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function mapManager(row: ManagerRow): Manager {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: tsToMs(row.created_at),
  };
}

export function mapChild(row: ChildRow): ChildProfile {
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    emoji: row.emoji,
    featuredVideoId: row.featured_video_id ?? undefined,
    createdAt: tsToMs(row.created_at),
  };
}

export function mapChannel(row: ChannelRow, childIds: string[]): YoutubeChannel {
  return {
    id: row.id,
    youtubeChannelId: row.youtube_channel_id,
    title: row.title,
    description: row.description ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    sourceUrl: row.source_url,
    childIds,
    createdAt: tsToMs(row.created_at),
    lastSyncedAt: row.last_synced_at ? tsToMs(row.last_synced_at) : undefined,
  };
}

export function mapVideo(row: VideoRow, childIds: string[]): Video {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    platform: row.platform as Video["platform"],
    embedId: row.embed_id ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    channelId: row.channel_id ?? undefined,
    channelTitle: row.channel_title ?? undefined,
    catalogChannelId: row.catalog_channel_id ?? undefined,
    childIds,
    createdAt: tsToMs(row.created_at),
  };
}

export function mapWatchSession(row: WatchSessionRow): WatchSession {
  return {
    id: row.id,
    childId: row.child_id,
    videoId: row.video_id,
    videoTitle: row.video_title,
    startedAt: tsToMs(row.started_at),
    endedAt: row.ended_at ? tsToMs(row.ended_at) : undefined,
    durationSeconds: row.duration_seconds,
    completed: row.completed,
  };
}

export function mapVideoJson(raw: Record<string, unknown>): Video {
  return {
    id: String(raw.id),
    title: String(raw.title),
    url: String(raw.url),
    platform: raw.platform as Video["platform"],
    embedId: raw.embedId ? String(raw.embedId) : undefined,
    thumbnail: raw.thumbnail ? String(raw.thumbnail) : undefined,
    channelId: raw.channelId ? String(raw.channelId) : undefined,
    channelTitle: raw.channelTitle ? String(raw.channelTitle) : undefined,
    catalogChannelId: raw.catalogChannelId ? String(raw.catalogChannelId) : undefined,
    childIds: Array.isArray(raw.childIds) ? raw.childIds.map(String) : [],
    createdAt: Number(raw.createdAt),
  };
}

export function mapChildJson(raw: Record<string, unknown>): ChildProfile {
  return {
    id: String(raw.id),
    name: String(raw.name),
    avatarColor: String(raw.avatarColor),
    emoji: String(raw.emoji),
    featuredVideoId: raw.featuredVideoId ? String(raw.featuredVideoId) : undefined,
    createdAt: Number(raw.createdAt),
  };
}

export function mapChannelJson(raw: Record<string, unknown>): YoutubeChannel {
  return {
    id: String(raw.id),
    youtubeChannelId: String(raw.youtubeChannelId),
    title: String(raw.title),
    description: raw.description ? String(raw.description) : undefined,
    thumbnail: raw.thumbnail ? String(raw.thumbnail) : undefined,
    sourceUrl: String(raw.sourceUrl),
    childIds: Array.isArray(raw.childIds) ? raw.childIds.map(String) : [],
    createdAt: Number(raw.createdAt),
    lastSyncedAt: raw.lastSyncedAt != null ? Number(raw.lastSyncedAt) : undefined,
  };
}
