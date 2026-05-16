import type { VideoPlatform } from "../types";

export interface ParsedVideo {
  platform: VideoPlatform;
  embedId?: string;
  embedUrl?: string;
  thumbnail?: string;
}

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = raw.trim();
  if (!url) return null;

  const youtube =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(url);
  if (youtube) {
    const id = youtube[1];
    return {
      platform: "youtube",
      embedId: id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) {
    const id = vimeo[1];
    return {
      platform: "vimeo",
      embedId: id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnail: undefined,
    };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.startsWith("blob:")) {
    return { platform: "direct", embedUrl: url };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { platform: "unknown", embedUrl: url };
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedParams(): string {
  return [
    "autoplay=1",
    "modestbranding=1",
    "rel=0",
    "controls=1",
    "disablekb=1",
    "fs=0",
    "iv_load_policy=3",
    "playsinline=1",
    "cc_load_policy=0",
    "enablejsapi=1",
    "origin=" + encodeURIComponent(window.location.origin),
  ].join("&");
}

export function vimeoEmbedParams(): string {
  return [
    "autoplay=1",
    "title=0",
    "byline=0",
    "portrait=0",
    "dnt=1",
    "transparent=0",
  ].join("&");
}

export function platformLabel(platform: VideoPlatform): string {
  const labels: Record<VideoPlatform, string> = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    direct: "Arquivo",
    unknown: "Link",
  };
  return labels[platform];
}
