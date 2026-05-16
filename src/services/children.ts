import { supabase } from "../lib/supabase/client";
import { mapChild, mapChildJson, type ChildRow } from "../lib/supabase/mappers";
import { requireUserId } from "../lib/supabase/helpers";
import type { ChildProfile } from "../types";
import { getVideo } from "./videos";

export async function listChildren(): Promise<ChildProfile[]> {
  const managerId = await requireUserId();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("manager_id", managerId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as ChildRow[]).map(mapChild);
}

export async function createChild(
  name: string,
  avatarColor: string,
  emoji: string
): Promise<ChildProfile> {
  const managerId = await requireUserId();
  const { data, error } = await supabase
    .from("children")
    .insert({
      manager_id: managerId,
      name: name.trim(),
      avatar_color: avatarColor,
      emoji,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erro ao criar perfil.");
  return mapChild(data as ChildRow);
}

export async function updateChild(
  id: string,
  data: Partial<Pick<ChildProfile, "name" | "avatarColor" | "emoji" | "featuredVideoId">>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.avatarColor !== undefined) patch.avatar_color = data.avatarColor;
  if (data.emoji !== undefined) patch.emoji = data.emoji;
  if (data.featuredVideoId !== undefined) {
    patch.featured_video_id = data.featuredVideoId ?? null;
  }

  const { error } = await supabase.from("children").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setChildFeaturedVideo(
  childId: string,
  videoId: string | null
): Promise<void> {
  if (videoId) {
    const video = await getVideo(videoId);
    if (!video?.childIds.includes(childId)) {
      throw new Error("Este vídeo não pertence à biblioteca deste perfil.");
    }
  }
  await updateChild(childId, { featuredVideoId: videoId ?? undefined });
}

export async function deleteChild(id: string): Promise<void> {
  const { error } = await supabase.from("children").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getChild(id: string): Promise<ChildProfile | undefined> {
  const { data, error } = await supabase.rpc("get_child_profile", { p_child_id: id });
  if (error) throw new Error(error.message);
  if (!data) return undefined;
  return mapChildJson(data as Record<string, unknown>);
}
