import { parseYouTubeChannelUrl } from "./youtube-channel-url";
import { parseVideoUrl } from "./video-url";

export type YoutubeLinkKind = "video" | "channel" | "invalid";

export function classifyYoutubeLink(raw: string): YoutubeLinkKind {
  const url = raw.trim();
  if (!url) return "invalid";
  if (parseYouTubeChannelUrl(url)) return "channel";
  const parsed = parseVideoUrl(url);
  if (parsed?.platform === "youtube" && parsed.embedId) return "video";
  return "invalid";
}

export function extractYoutubeVideoId(raw: string): string | null {
  return parseVideoUrl(raw.trim())?.embedId ?? null;
}
