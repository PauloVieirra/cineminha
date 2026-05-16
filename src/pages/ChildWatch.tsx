import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChannelRelatedRow } from "../components/child/ChannelRelatedRow";
import { SwipeablePlayer } from "../components/child/SwipeablePlayer";
import { SafePlayer } from "../components/SafePlayer";
import {
  loadChannelContext,
  saveChannelContext,
  savePlaylist,
  videoFromYoutubeId,
  type PlaylistEntry,
} from "../lib/playback";
import {
  getYouTubeChannelVideos,
  getYouTubeVideoDetails,
  type YouTubeSearchItem,
} from "../lib/youtube-api";
import { getChannel } from "../services/channels";
import { youtubeChannelPageUrl } from "../lib/youtube-channel-url";
import {
  endWatchSession,
  startWatchSession,
  updateWatchSession,
} from "../services/history";
import { listVideosForChild } from "../services/videos";
import { useAsyncData } from "../hooks/useAsyncData";
import type { Video } from "../types";

function buildPlaylist(
  library: Video[],
  channelItems: YouTubeSearchItem[],
  current: { kind: "library"; videoId: string } | { kind: "youtube"; youtubeId: string }
): PlaylistEntry[] {
  const entries: PlaylistEntry[] = library.map((v) => ({ kind: "library", videoId: v.id }));
  const libYtIds = new Set(library.map((v) => v.embedId).filter(Boolean));

  for (const item of channelItems) {
    if (!libYtIds.has(item.videoId)) {
      entries.push({
        kind: "youtube",
        youtubeId: item.videoId,
        title: item.title,
        thumbnail: item.thumbnail,
      });
    }
  }

  const idx = entries.findIndex((e) =>
    e.kind === "library"
      ? current.kind === "library" && e.videoId === current.videoId
      : current.kind === "youtube" && e.youtubeId === current.youtubeId
  );
  if (idx > 0) {
    const [item] = entries.splice(idx, 1);
    entries.unshift(item);
  } else if (idx === -1 && current.kind === "youtube") {
    entries.unshift({
      kind: "youtube",
      youtubeId: current.youtubeId,
      title: "",
      thumbnail: `https://img.youtube.com/vi/${current.youtubeId}/hqdefault.jpg`,
    });
  }

  return entries;
}

export function ChildWatch() {
  const { childId, videoId, youtubeId } = useParams<{
    childId: string;
    videoId?: string;
    youtubeId?: string;
  }>();
  const navigate = useNavigate();
  const sessionRef = useRef<string | null>(null);
  const lastDuration = useRef(0);

  const [channelItems, setChannelItems] = useState<YouTubeSearchItem[]>([]);
  const [ephemeralVideo, setEphemeralVideo] = useState<Video | null>(null);
  const [channelError, setChannelError] = useState("");

  const { data: library } = useAsyncData(
    () => (childId ? listVideosForChild(childId) : Promise.resolve([])),
    [childId]
  );

  const { data: dbVideo } = useAsyncData(async () => {
    if (!videoId || !childId) return undefined;
    const list = await listVideosForChild(childId);
    return list.find((v) => v.id === videoId);
  }, [videoId, childId]);

  const { data: allowed } = useAsyncData(async () => {
    if (!childId) return false;
    if (videoId) {
      const list = await listVideosForChild(childId);
      return list.some((v) => v.id === videoId);
    }
    if (youtubeId) {
      const ctx = loadChannelContext(childId);
      if (!ctx) return false;
      try {
        const meta = await getYouTubeVideoDetails(youtubeId);
        return meta?.channelId === ctx.channelId;
      } catch {
        return false;
      }
    }
    return false;
  }, [childId, videoId, youtubeId]);

  const playbackVideo = useMemo(() => {
    if (videoId && dbVideo) return dbVideo;
    if (youtubeId && ephemeralVideo) return ephemeralVideo;
    return undefined;
  }, [videoId, dbVideo, youtubeId, ephemeralVideo]);

  const activeYoutubeId = videoId ? dbVideo?.embedId : youtubeId;

  const libraryByYoutubeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of library ?? []) {
      if (v.embedId) map.set(v.embedId, v.id);
    }
    return map;
  }, [library]);

  const playlist = useMemo(() => {
    if (!library) return [];
    const current =
      videoId && dbVideo
        ? ({ kind: "library" as const, videoId })
        : youtubeId
          ? ({ kind: "youtube" as const, youtubeId })
          : null;
    if (!current) return [];
    return buildPlaylist(library, channelItems, current);
  }, [library, channelItems, videoId, youtubeId, dbVideo]);

  useEffect(() => {
    if (childId && playlist.length) savePlaylist(childId, playlist);
  }, [childId, playlist]);

  const playlistIndex = useMemo(() => {
    if (videoId) return playlist.findIndex((e) => e.kind === "library" && e.videoId === videoId);
    if (youtubeId)
      return playlist.findIndex((e) => e.kind === "youtube" && e.youtubeId === youtubeId);
    return -1;
  }, [playlist, videoId, youtubeId]);

  const goPlaylistIndex = useCallback(
    (index: number) => {
      if (!childId || index < 0 || index >= playlist.length) return;
      const entry = playlist[index];
      if (entry.kind === "library") {
        navigate(`/assistir/${childId}/video/${entry.videoId}`, { replace: true });
      } else {
        navigate(`/assistir/${childId}/yt/${entry.youtubeId}`, { replace: true });
      }
    },
    [childId, navigate, playlist]
  );

  useEffect(() => {
    if (allowed === false && childId) {
      navigate(`/assistir/${childId}`, { replace: true });
    }
  }, [allowed, childId, navigate]);

  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;
    getYouTubeVideoDetails(youtubeId).then((meta) => {
      if (cancelled || !meta) return;
      setEphemeralVideo(
        videoFromYoutubeId(meta.videoId, meta.title, meta.thumbnail, meta.channelId, meta.channelTitle)
      );
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  useEffect(() => {
    const source = dbVideo ?? ephemeralVideo;
    if (!childId || !source || source.platform !== "youtube") {
      setChannelItems([]);
      return;
    }

    let channelId = source.channelId;
    let channelTitle = source.channelTitle ?? "";

    const load = async () => {
      try {
        if (!channelId && source.embedId) {
          const meta = await getYouTubeVideoDetails(source.embedId);
          if (meta) {
            channelId = meta.channelId;
            channelTitle = meta.channelTitle;
          }
        }

        let sourceUrl: string | null = null;
        if (dbVideo?.catalogChannelId) {
          const catalog = await getChannel(dbVideo.catalogChannelId);
          sourceUrl = catalog?.sourceUrl ?? null;
        }
        if (!sourceUrl && channelId) {
          sourceUrl = youtubeChannelPageUrl(channelId);
        }
        if (!sourceUrl) return;

        saveChannelContext(childId, {
          channelId: channelId ?? "",
          channelTitle,
        });

        const items = await getYouTubeChannelVideos(sourceUrl, {
          maxResults: 14,
          excludeVideoId: source.embedId,
        });
        setChannelItems(items);
        setChannelError("");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao carregar canal";
        setChannelError(
          msg.includes("agente") || msg.includes("Agente")
            ? msg
            : `${msg} — verifique se o agente Python está rodando (npm run agent).`
        );
      }
    };

    load();
  }, [childId, dbVideo, ephemeralVideo]);

  useEffect(() => {
    if (!childId || !playbackVideo || !allowed) return;

    let cancelled = false;
    const trackId = videoId ?? `yt-${youtubeId}`;

    (async () => {
      const session = await startWatchSession(childId, trackId, playbackVideo.title);
      if (!cancelled) sessionRef.current = session.id;
    })();

    return () => {
      cancelled = true;
      const sid = sessionRef.current;
      if (sid) {
        endWatchSession(sid, lastDuration.current);
        sessionRef.current = null;
      }
    };
  }, [childId, videoId, youtubeId, playbackVideo?.title, allowed]);

  const onProgress = useCallback((seconds: number) => {
    lastDuration.current = seconds;
    const sid = sessionRef.current;
    if (sid) updateWatchSession(sid, seconds);
  }, []);

  const onComplete = useCallback(() => {
    const sid = sessionRef.current;
    if (sid) updateWatchSession(sid, lastDuration.current, true);
  }, []);

  const selectYoutube = (item: YouTubeSearchItem) => {
    navigate(`/assistir/${childId}/yt/${item.videoId}`);
  };

  const selectLibrary = (id: string) => {
    navigate(`/assistir/${childId}/video/${id}`);
  };

  if (!childId || (!videoId && !youtubeId)) {
    navigate("/");
    return null;
  }

  const hasPrev = playlistIndex > 0;
  const hasNext = playlistIndex >= 0 && playlistIndex < playlist.length - 1;

  return (
    <div className="gradient-mesh child-watch-page min-h-dvh">
      <p className="watch-landscape-hint" aria-live="polite">
        Gire para retrato para sair da tela cheia
      </p>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <header className="child-watch-chrome mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/assistir/${childId}`)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full glass text-white transition hover:bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="line-clamp-2 flex-1 text-lg font-bold sm:text-xl">
            {playbackVideo?.title ?? "Carregando..."}
          </h1>
        </header>

        {playbackVideo ? (
          <SwipeablePlayer
            hasPrev={hasPrev}
            hasNext={hasNext}
            onSwipePrev={() => goPlaylistIndex(playlistIndex - 1)}
            onSwipeNext={() => goPlaylistIndex(playlistIndex + 1)}
            hint="Arraste para o lado para o próximo vídeo"
            hideHintOnLandscape
          >
            <motion.div
              key={playbackVideo.id + (playbackVideo.embedId ?? "")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="watch-player-wrap overflow-hidden rounded-2xl"
            >
              <SafePlayer
                video={playbackVideo}
                onProgress={onProgress}
                onComplete={onComplete}
                landscapeFullscreen
              />
            </motion.div>
          </SwipeablePlayer>
        ) : (
          <div className="aspect-video animate-pulse rounded-2xl bg-slate-800" />
        )}

        <div className="child-watch-below-player">
        {channelError ? (
          <p className="mt-4 text-center text-sm text-slate-500">{channelError}</p>
        ) : null}

        <ChannelRelatedRow
          channelTitle={dbVideo?.channelTitle ?? ephemeralVideo?.channelTitle}
          items={channelItems}
          activeYoutubeId={activeYoutubeId}
          libraryByYoutubeId={libraryByYoutubeId}
          onSelectYoutube={selectYoutube}
          onSelectLibrary={selectLibrary}
        />

        {(library?.length ?? 0) > 1 ? (
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              📚 Sua biblioteca
            </p>
            <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {library?.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectLibrary(v.id)}
                  className={`w-36 shrink-0 snap-center overflow-hidden rounded-xl text-left ${
                    videoId === v.id ? "ring-2 ring-emerald-400" : ""
                  }`}
                >
                  <div className="aspect-video bg-slate-800">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">🎬</div>
                    )}
                  </div>
                  <p className="line-clamp-2 p-2 text-xs font-medium">{v.title}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        </div>
      </div>
    </div>
  );
}
