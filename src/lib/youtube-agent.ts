/** Cliente do agente Python (yt-dlp) — sem API oficial do YouTube. */

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

const LOCAL_AGENT = "http://127.0.0.1:8765";
/** Proxy na Vercel → Railway (mesma origem, sem CORS). */
const PROD_AGENT_PROXY = "/api/agent";

function normalizeAgentBase(raw: string): string {
  let base = raw.trim().replace(/\/+$/, "");
  if (!base) return LOCAL_AGENT;
  if (base.startsWith("/")) return base;
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  return base;
}

function resolveAgentBase(): string {
  const env = import.meta.env.VITE_YOUTUBE_AGENT_URL?.trim();

  if (import.meta.env.PROD) {
    // Produção: proxy /api/agent evita CORS (ver vercel.json)
    if (!env || /127\.0\.0\.1|localhost|railway\.app/i.test(env)) {
      return PROD_AGENT_PROXY;
    }
    return normalizeAgentBase(env);
  }

  return normalizeAgentBase(env || LOCAL_AGENT);
}

const AGENT_BASE = resolveAgentBase();
const IS_PROD = import.meta.env.PROD;
const HEALTH_TIMEOUT_MS = IS_PROD ? 15000 : 4000;

let agentOnline: boolean | null = null;

export const CHANNEL_IMPORT_VIDEO_LIMIT = 30;

export function getAgentBaseUrl(): string {
  return AGENT_BASE;
}

export function isAgentMisconfiguredInProduction(): boolean {
  return IS_PROD && /127\.0\.0\.1|localhost/i.test(AGENT_BASE);
}

export function getAgentOfflineHelp(): string {
  if (isAgentMisconfiguredInProduction()) {
    return "Em produção o site usa o proxy /api/agent. Remova VITE_YOUTUBE_AGENT_URL=127.0.0.1 na Vercel e faça Redeploy.";
  }
  if (IS_PROD) {
    return "Agente indisponível. Teste /api/agent/health no seu site (proxy para o Railway).";
  }
  return "Inicie o agente local: npm run agent (ou npm run dev:all).";
}

export async function checkYoutubeAgent(): Promise<boolean> {
  if (isAgentMisconfiguredInProduction()) {
    agentOnline = false;
    return false;
  }
  try {
    const res = await fetch(`${AGENT_BASE}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    agentOnline = res.ok;
  } catch {
    agentOnline = false;
  }
  return agentOnline;
}

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
        ? `Agente indisponível. ${getAgentOfflineHelp()}`
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
