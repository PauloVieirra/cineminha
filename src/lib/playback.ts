import type { Video } from "../types";
import { readAppStorage, writeAppStorage } from "./app-storage";
import { youtubeWatchUrl } from "./youtube-api";

export function videoFromYoutubeId(
  youtubeId: string,
  title: string,
  thumbnail?: string,
  channelId?: string,
  channelTitle?: string
): Video {
  return {
    id: `yt-${youtubeId}`,
    title,
    url: youtubeWatchUrl(youtubeId),
    platform: "youtube",
    embedId: youtubeId,
    thumbnail: thumbnail ?? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    channelId,
    channelTitle,
    childIds: [],
    createdAt: Date.now(),
  };
}

export type PlaylistEntry =
  | { kind: "library"; videoId: string }
  | { kind: "youtube"; youtubeId: string; title: string; thumbnail: string };

const PLAYLIST_KEY = "cineminha_playlist";
const CHANNEL_KEY = "cineminha_channel_ctx";

export function savePlaylist(childId: string, playlist: PlaylistEntry[]): void {
  writeAppStorage(`${PLAYLIST_KEY}_${childId}`, JSON.stringify(playlist));
}

export function loadPlaylist(childId: string): PlaylistEntry[] {
  try {
    const raw = readAppStorage(`${PLAYLIST_KEY}_${childId}`);
    return raw ? (JSON.parse(raw) as PlaylistEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveChannelContext(
  childId: string,
  ctx: { channelId: string; channelTitle: string }
): void {
  writeAppStorage(`${CHANNEL_KEY}_${childId}`, JSON.stringify(ctx));
}

export function loadChannelContext(childId: string): {
  channelId: string;
  channelTitle: string;
} | null {
  try {
    const raw = readAppStorage(`${CHANNEL_KEY}_${childId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
