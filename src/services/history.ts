import { supabase } from "../lib/supabase/client";
import { mapWatchSession, msToIso, type WatchSessionRow } from "../lib/supabase/mappers";
import type { WatchSession } from "../types";

export async function startWatchSession(
  childId: string,
  videoId: string,
  videoTitle: string
): Promise<WatchSession> {
  const { data, error } = await supabase
    .from("watch_sessions")
    .insert({
      child_id: childId,
      video_id: videoId,
      video_title: videoTitle,
      duration_seconds: 0,
      completed: false,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erro ao iniciar sessão.");
  return mapWatchSession(data as WatchSessionRow);
}

export async function updateWatchSession(
  sessionId: string,
  durationSeconds: number,
  completed = false
): Promise<void> {
  const patch: Record<string, unknown> = {
    duration_seconds: durationSeconds,
    completed,
  };
  if (completed) patch.ended_at = msToIso(Date.now());

  const { error } = await supabase.from("watch_sessions").update(patch).eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function endWatchSession(sessionId: string, durationSeconds: number): Promise<void> {
  const { error } = await supabase
    .from("watch_sessions")
    .update({
      duration_seconds: durationSeconds,
      ended_at: msToIso(Date.now()),
    })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function listWatchHistory(options?: {
  childId?: string;
  limit?: number;
}): Promise<WatchSession[]> {
  let query = supabase
    .from("watch_sessions")
    .select("*")
    .order("started_at", { ascending: false });

  if (options?.childId) {
    query = query.eq("child_id", options.childId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as WatchSessionRow[]).map(mapWatchSession);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}min ${s > 0 ? `${s}s` : ""}`.trim();
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}
