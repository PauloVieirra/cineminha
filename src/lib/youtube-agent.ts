/** Cliente do agente Python local (yt-dlp) — sem API oficial do YouTube. */

export interface YouTubeSearchItem {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
}

export interface YouTubeChannelInfo {
  youtubeChannelId: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface YouTubeChannelPayload extends YouTubeChannelInfo {
  videos: YouTubeSearchItem[];
}

/** Garante URL absoluta (sem https o browser trata como path relativo à página atual). */
function normalizeAgentBase(raw: string | undefined): string {
  const fallback = "http://127.0.0.1:8765";
  let base = (raw?.trim() || fallback).replace(/\/+$/, "");
  if (!base) return fallback;
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  return base;
}

const AGENT_BASE = normalizeAgentBase(import.meta.env.VITE_YOUTUBE_AGENT_URL);

let agentOnline: boolean | null = null;

export const CHANNEL_IMPORT_VIDEO_LIMIT = 30;

export function getAgentBaseUrl(): string {
  return AGENT_BASE;
}

export async function checkYoutubeAgent(): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_BASE}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    agentOnline = res.ok;
  } catch {
    agentOnline = false;
  }
  return agentOnline;
}

/** Compatível com código que checava API key — agora verifica o agente Python. */
export function hasYouTubeApiKey(): boolean {
  return agentOnline === true;
}

export function isYoutubeAgentOnline(): boolean {
  return agentOnline === true;
}

export function setYoutubeAgentStatus(online: boolean): void {
  agentOnline = online;
}

async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AGENT_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string };
    const msg =
      body.detail ??
      (res.status === 0 || res.status >= 500
        ? "Agente Python indisponível. Execute: npm run agent"
        : `Erro do agente (${res.status})`);
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export async function fetchChannelFromAgent(
  url: string,
  maxResults = CHANNEL_IMPORT_VIDEO_LIMIT
): Promise<YouTubeChannelPayload> {
  return agentFetch<YouTubeChannelPayload>("/youtube/channel", {
    method: "POST",
    body: JSON.stringify({ url, max_results: maxResults }),
  });
}

export async function searchYouTubeVideos(
  query: string,
  maxResults = 12
): Promise<YouTubeSearchItem[]> {
  const data = await agentFetch<{ items: YouTubeSearchItem[] }>("/youtube/search", {
    method: "POST",
    body: JSON.stringify({ query, max_results: maxResults }),
  });
  return data.items ?? [];
}

export async function getYouTubeVideoDetails(
  videoId: string
): Promise<YouTubeSearchItem | null> {
  try {
    return await agentFetch<YouTubeSearchItem>(`/youtube/video/${encodeURIComponent(videoId)}`);
  } catch {
    return null;
  }
}

export async function getYouTubeChannelVideos(
  channelSourceUrl: string,
  options?: { maxResults?: number; excludeVideoId?: string }
): Promise<YouTubeSearchItem[]> {
  const payload = await fetchChannelFromAgent(
    channelSourceUrl,
    options?.maxResults ?? CHANNEL_IMPORT_VIDEO_LIMIT
  );
  let videos = payload.videos ?? [];
  if (options?.excludeVideoId) {
    videos = videos.filter((v) => v.videoId !== options.excludeVideoId);
  }
  return videos;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
