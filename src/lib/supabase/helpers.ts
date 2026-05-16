import { assertSupabaseConfigured, supabase } from "./client";
import { mapVideo, type VideoRow } from "./mappers";
import type { Video } from "../../types";

export async function requireUserId(): Promise<string> {
  assertSupabaseConfigured();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sessão expirada. Faça login novamente.");
  return user.id;
}

export async function loadChildIdsForVideos(videoIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!videoIds.length) return map;

  const { data, error } = await supabase
    .from("video_children")
    .select("video_id, child_id")
    .in("video_id", videoIds);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const list = map.get(row.video_id) ?? [];
    list.push(row.child_id);
    map.set(row.video_id, list);
  }
  return map;
}

export async function loadChildIdsForChannels(channelIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!channelIds.length) return map;

  const { data, error } = await supabase
    .from("channel_children")
    .select("channel_id, child_id")
    .in("channel_id", channelIds);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const list = map.get(row.channel_id) ?? [];
    list.push(row.child_id);
    map.set(row.channel_id, list);
  }
  return map;
}

export async function videosFromRows(rows: VideoRow[]): Promise<Video[]> {
  const childMap = await loadChildIdsForVideos(rows.map((r) => r.id));
  return rows.map((r) => mapVideo(r, childMap.get(r.id) ?? []));
}

export async function syncVideoChildren(videoId: string, childIds: string[]): Promise<void> {
  await supabase.from("video_children").delete().eq("video_id", videoId);
  if (!childIds.length) return;
  const { error } = await supabase.from("video_children").insert(
    childIds.map((child_id) => ({ video_id: videoId, child_id }))
  );
  if (error) throw new Error(error.message);
}

export async function syncChannelChildren(channelId: string, childIds: string[]): Promise<void> {
  const unique = [...new Set(childIds)];
  const { data: existing } = await supabase
    .from("channel_children")
    .select("child_id")
    .eq("channel_id", channelId);

  const current = new Set((existing ?? []).map((r) => r.child_id));
  const toAdd = unique.filter((id) => !current.has(id));
  if (toAdd.length) {
    const { error } = await supabase.from("channel_children").insert(
      toAdd.map((child_id) => ({ channel_id: channelId, child_id }))
    );
    if (error) throw new Error(error.message);
  }
}

export async function mergeVideoChildren(videoId: string, childIds: string[]): Promise<string[]> {
  const { data } = await supabase
    .from("video_children")
    .select("child_id")
    .eq("video_id", videoId);
  const merged = [...new Set([...(data ?? []).map((r) => r.child_id), ...childIds])];
  await syncVideoChildren(videoId, merged);
  return merged;
}
