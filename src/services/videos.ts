import { supabase } from "../lib/supabase/client";
import {
  loadChildIdsForVideos,
  mergeVideoChildren,
  requireUserId,
  syncVideoChildren,
  videosFromRows,
} from "../lib/supabase/helpers";
import { mapVideo, mapVideoJson, type VideoRow } from "../lib/supabase/mappers";
import { parseVideoUrl } from "../lib/video-url";
import { getYouTubeVideoDetails } from "../lib/youtube-api";
import type { Video } from "../types";

export async function listVideos(): Promise<Video[]> {
  const managerId = await requireUserId();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("manager_id", managerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return videosFromRows((data ?? []) as VideoRow[]);
}

export async function listVideosForChild(childId: string): Promise<Video[]> {
  const { data, error } = await supabase.rpc("get_child_videos", { p_child_id: childId });
  if (error) throw new Error(error.message);
  const list = (data ?? []) as Record<string, unknown>[];
  return list.map(mapVideoJson);
}

export async function addVideo(
  url: string,
  title: string,
  childIds: string[]
): Promise<Video> {
  if (childIds.length === 0) {
    throw new Error("Selecione pelo menos um perfil para a biblioteca.");
  }
  const parsed = parseVideoUrl(url);
  if (!parsed) throw new Error("Link de vídeo inválido. Use YouTube, Vimeo ou arquivo .mp4.");

  const managerId = await requireUserId();

  let channelId: string | undefined;
  let channelTitle: string | undefined;
  let finalTitle = title.trim();
  let thumbnail = parsed.thumbnail;

  if (parsed.platform === "youtube" && parsed.embedId) {
    try {
      const meta = await getYouTubeVideoDetails(parsed.embedId);
      if (meta) {
        channelId = meta.channelId;
        channelTitle = meta.channelTitle;
        if (!finalTitle) finalTitle = meta.title;
        thumbnail = meta.thumbnail;
      }
    } catch {
      /* agente offline */
    }
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      manager_id: managerId,
      title: finalTitle || "Vídeo sem título",
      url: url.trim(),
      platform: parsed.platform,
      embed_id: parsed.embedId ?? null,
      thumbnail: thumbnail ?? null,
      channel_id: channelId ?? null,
      channel_title: channelTitle ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erro ao adicionar vídeo.");

  await syncVideoChildren(data.id, childIds);
  return mapVideo(data as VideoRow, childIds);
}

export async function updateVideo(
  id: string,
  data: Partial<Pick<Video, "title" | "childIds" | "channelId" | "channelTitle">>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.channelId !== undefined) patch.channel_id = data.channelId;
  if (data.channelTitle !== undefined) patch.channel_title = data.channelTitle;

  if (Object.keys(patch).length) {
    const { error } = await supabase.from("videos").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (data.childIds) {
    await syncVideoChildren(id, data.childIds);
  }
}

export async function deleteVideo(id: string): Promise<void> {
  await supabase.from("children").update({ featured_video_id: null }).eq("featured_video_id", id);
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getVideo(id: string): Promise<Video | undefined> {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error || !data) return undefined;
  const childMap = await loadChildIdsForVideos([data.id]);
  return mapVideo(data as VideoRow, childMap.get(data.id) ?? []);
}

export { mergeVideoChildren };
