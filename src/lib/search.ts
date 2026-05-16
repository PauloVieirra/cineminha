import type { Video } from "../types";

export function normalizeSearch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function filterVideosByQuery(videos: Video[], query: string): Video[] {
  const q = normalizeSearch(query);
  if (!q) return videos;
  return videos.filter((v) => normalizeSearch(v.title).includes(q));
}

export function orderVideosForHero(
  videos: Video[],
  featuredVideoId?: string
): Video[] {
  if (!featuredVideoId) return videos;
  const featured = videos.find((v) => v.id === featuredVideoId);
  if (!featured) return videos;
  return [featured, ...videos.filter((v) => v.id !== featuredVideoId)];
}
