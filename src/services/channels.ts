import {
  parseYouTubeChannelUrl,
  youtubeChannelPageUrl,
} from "../lib/youtube-channel-url";
import {
  CHANNEL_IMPORT_VIDEO_LIMIT,
  fetchChannelFromAgent,
  getYouTubeChannelVideos,
  youtubeWatchUrl,
} from "../lib/youtube-api";
import { supabase } from "../lib/supabase/client";
import {
  loadChildIdsForChannels,
  loadChildIdsForVideos,
  mergeVideoChildren,
  requireUserId,
  syncChannelChildren,
  syncVideoChildren,
  videosFromRows,
} from "../lib/supabase/helpers";
import { mapChannel, mapVideo, type ChannelRow, type VideoRow } from "../lib/supabase/mappers";
import type { Video, YoutubeChannel } from "../types";

export type ChannelVideoItem = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
};

export async function getChannel(id: string): Promise<YoutubeChannel | undefined> {
  const { data, error } = await supabase
    .from("youtube_channels")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  const childMap = await loadChildIdsForChannels([data.id]);
  return mapChannel(data as ChannelRow, childMap.get(data.id) ?? []);
}

export async function listChannels(): Promise<YoutubeChannel[]> {
  const managerId = await requireUserId();
  const { data, error } = await supabase
    .from("youtube_channels")
    .select("*")
    .eq("manager_id", managerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ChannelRow[];
  const childMap = await loadChildIdsForChannels(rows.map((r) => r.id));
  return rows.map((r) => mapChannel(r, childMap.get(r.id) ?? []));
}

export async function listChannelsForChild(childId: string): Promise<YoutubeChannel[]> {
  const { data, error } = await supabase.rpc("get_child_channels", { p_child_id: childId });
  if (error) throw new Error(error.message);
  const list = (data ?? []) as Record<string, unknown>[];
  return list.map((raw) => ({
    id: String(raw.id),
    youtubeChannelId: String(raw.youtubeChannelId),
    title: String(raw.title),
    description: raw.description ? String(raw.description) : undefined,
    thumbnail: raw.thumbnail ? String(raw.thumbnail) : undefined,
    sourceUrl: String(raw.sourceUrl),
    childIds: Array.isArray(raw.childIds) ? raw.childIds.map(String) : [],
    createdAt: Number(raw.createdAt),
    lastSyncedAt: raw.lastSyncedAt != null ? Number(raw.lastSyncedAt) : undefined,
  }));
}

export async function listVideosForCatalogChannel(
  catalogChannelId: string,
  childId?: string
): Promise<Video[]> {
  const managerId = await requireUserId();
  let query = supabase
    .from("videos")
    .select("*")
    .eq("manager_id", managerId)
    .eq("catalog_channel_id", catalogChannelId)
    .order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let videos = await videosFromRows((data ?? []) as VideoRow[]);
  if (childId) videos = videos.filter((v) => v.childIds.includes(childId));
  return videos;
}

export async function getVideoByEmbedId(embedId: string): Promise<Video | undefined> {
  const managerId = await requireUserId();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("manager_id", managerId)
    .eq("embed_id", embedId)
    .maybeSingle();

  if (error || !data) return undefined;
  const childMap = await loadChildIdsForVideos([data.id]);
  return mapVideo(data as VideoRow, childMap.get(data.id) ?? []);
}

export async function isVideoInLibraryForProfiles(
  embedId: string,
  childIds: string[]
): Promise<boolean> {
  if (!childIds.length) return false;
  const video = await getVideoByEmbedId(embedId);
  if (!video) return false;
  return childIds.every((id) => video.childIds.includes(id));
}

export async function filterVideosNotInLibrary(
  items: ChannelVideoItem[],
  childIds: string[]
): Promise<ChannelVideoItem[]> {
  const pending: ChannelVideoItem[] = [];
  for (const item of items) {
    const inLib = await isVideoInLibraryForProfiles(item.videoId, childIds);
    if (!inLib) pending.push(item);
  }
  return pending;
}

export async function ensureYoutubeChannel(
  sourceUrl: string,
  childIds: string[]
): Promise<{ channel: YoutubeChannel; videos: ChannelVideoItem[] }> {
  if (childIds.length === 0) {
    throw new Error("Selecione pelo menos um perfil.");
  }

  if (!parseYouTubeChannelUrl(sourceUrl)) {
    throw new Error(
      "Link de canal inválido. Use youtube.com/@canal, /channel/UC... ou /c/nome"
    );
  }

  const managerId = await requireUserId();
  const payload = await fetchChannelFromAgent(
    sourceUrl.trim(),
    CHANNEL_IMPORT_VIDEO_LIMIT
  );

  const stableSourceUrl = payload.youtubeChannelId.startsWith("UC")
    ? `${youtubeChannelPageUrl(payload.youtubeChannelId)}/videos`
    : sourceUrl.trim();

  const { data: existing } = await supabase
    .from("youtube_channels")
    .select("*")
    .eq("manager_id", managerId)
    .eq("youtube_channel_id", payload.youtubeChannelId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("youtube_channels")
      .update({
        title: payload.title,
        description: payload.description,
        thumbnail: payload.thumbnail,
        source_url: stableSourceUrl,
      })
      .eq("id", existing.id);

    await syncChannelChildren(existing.id, childIds);
    const childMap = await loadChildIdsForChannels([existing.id]);
    const channel = mapChannel(existing as ChannelRow, childMap.get(existing.id) ?? childIds);
    return { channel, videos: payload.videos };
  }

  const { data: created, error } = await supabase
    .from("youtube_channels")
    .insert({
      manager_id: managerId,
      youtube_channel_id: payload.youtubeChannelId,
      title: payload.title,
      description: payload.description,
      thumbnail: payload.thumbnail,
      source_url: stableSourceUrl,
    })
    .select("*")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Erro ao criar canal.");

  await syncChannelChildren(created.id, childIds);
  const channel = mapChannel(created as ChannelRow, childIds);
  return { channel, videos: payload.videos };
}

export async function fetchChannelVideosFromAgent(
  sourceUrl: string
): Promise<ChannelVideoItem[]> {
  const payload = await fetchChannelFromAgent(sourceUrl, CHANNEL_IMPORT_VIDEO_LIMIT);
  return payload.videos;
}

export async function fetchChannelVideosPreview(
  catalogChannelId: string
): Promise<ChannelVideoItem[]> {
  const channel = await getChannel(catalogChannelId);
  if (!channel) throw new Error("Canal não encontrado.");
  const fetchUrl = channel.youtubeChannelId.startsWith("UC")
    ? `${youtubeChannelPageUrl(channel.youtubeChannelId)}/videos`
    : channel.sourceUrl;
  return getYouTubeChannelVideos(fetchUrl, {
    maxResults: CHANNEL_IMPORT_VIDEO_LIMIT,
  });
}

export async function addVideoToChannelLibrary(
  catalogChannelId: string,
  item: ChannelVideoItem,
  childIds: string[]
): Promise<Video> {
  if (childIds.length === 0) throw new Error("Selecione pelo menos um perfil.");

  const channel = await getChannel(catalogChannelId);
  if (!channel) throw new Error("Canal não encontrado.");

  const managerId = await requireUserId();
  const existing = await getVideoByEmbedId(item.videoId);

  if (existing) {
    const mergedChildIds = await mergeVideoChildren(existing.id, childIds);
    await supabase
      .from("videos")
      .update({
        catalog_channel_id: catalogChannelId,
        channel_id: item.channelId || channel.youtubeChannelId,
        channel_title: item.channelTitle || channel.title,
        thumbnail: item.thumbnail,
        title: item.title,
      })
      .eq("id", existing.id);

    const { data } = await supabase.from("videos").select("*").eq("id", existing.id).single();
    if (!data) throw new Error("Vídeo não encontrado.");
    return mapVideo(data as VideoRow, mergedChildIds);
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      manager_id: managerId,
      title: item.title,
      url: youtubeWatchUrl(item.videoId),
      platform: "youtube",
      embed_id: item.videoId,
      thumbnail: item.thumbnail,
      channel_id: item.channelId || channel.youtubeChannelId,
      channel_title: item.channelTitle || channel.title,
      catalog_channel_id: catalogChannelId,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erro ao adicionar vídeo.");
  await syncVideoChildren(data.id, childIds);
  return mapVideo(data as VideoRow, childIds);
}

export type ImportProgressCallback = (current: number, total: number, title: string) => void;

export async function importAllChannelVideos(
  catalogChannelId: string,
  items: ChannelVideoItem[],
  childIds: string[],
  onProgress?: ImportProgressCallback
): Promise<{ imported: number; skipped: number }> {
  const pending = await filterVideosNotInLibrary(items, childIds);
  const batch = pending.slice(0, CHANNEL_IMPORT_VIDEO_LIMIT);
  const total = batch.length;
  let imported = 0;

  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    onProgress?.(i + 1, total, item.title);
    await addVideoToChannelLibrary(catalogChannelId, item, childIds);
    imported++;
  }

  return {
    imported,
    skipped: items.length - batch.length + (pending.length - batch.length),
  };
}

export async function removeVideoFromChannelLibrary(
  _catalogChannelId: string,
  embedId: string,
  childIds: string[]
): Promise<void> {
  const video = await getVideoByEmbedId(embedId);
  if (!video) return;

  const remaining = video.childIds.filter((id) => !childIds.includes(id));

  if (remaining.length === 0) {
    await supabase.from("children").update({ featured_video_id: null }).eq("featured_video_id", video.id);
    await supabase.from("videos").delete().eq("id", video.id);
    return;
  }

  await syncVideoChildren(video.id, remaining);
}

export async function removeChannelLibraryVideoById(
  videoId: string,
  childIds: string[]
): Promise<void> {
  const video = await (async () => {
    const { data } = await supabase.from("videos").select("*").eq("id", videoId).maybeSingle();
    if (!data) return undefined;
    const childMap = await loadChildIdsForVideos([data.id]);
    return mapVideo(data as VideoRow, childMap.get(data.id) ?? []);
  })();
  if (!video?.embedId) return;
  await removeVideoFromChannelLibrary(
    video.catalogChannelId ?? "",
    video.embedId,
    childIds.length ? childIds : video.childIds
  );
}

export async function refreshChannelVideoList(
  catalogChannelId: string
): Promise<ChannelVideoItem[]> {
  const videos = await fetchChannelVideosPreview(catalogChannelId);
  await supabase
    .from("youtube_channels")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", catalogChannelId);
  return videos;
}

export async function deleteChannel(catalogChannelId: string): Promise<void> {
  const managerId = await requireUserId();
  const { data: videos } = await supabase
    .from("videos")
    .select("id")
    .eq("catalog_channel_id", catalogChannelId)
    .eq("manager_id", managerId);

  const videoIds = (videos ?? []).map((v) => v.id);
  if (videoIds.length) {
    await supabase.from("children").update({ featured_video_id: null }).in("featured_video_id", videoIds);
    await supabase.from("videos").delete().in("id", videoIds);
  }

  const { error } = await supabase.from("youtube_channels").delete().eq("id", catalogChannelId);
  if (error) throw new Error(error.message);
}

export function isYouTubeChannelUrl(url: string): boolean {
  return parseYouTubeChannelUrl(url) !== null;
}

export async function syncChannelVideos(catalogChannelId: string): Promise<number> {
  const list = await refreshChannelVideoList(catalogChannelId);
  return list.length;
}
