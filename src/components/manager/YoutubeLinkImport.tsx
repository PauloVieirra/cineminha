import { Download, Film, Loader2, Search, Tv, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useYoutubeAgent } from "../../hooks/useYoutubeAgent";
import {
  CHANNEL_IMPORT_VIDEO_LIMIT,
  fetchChannelFromAgent,
  getAgentOfflineHelp,
  getYouTubeVideoDetails,
  isAgentMisconfiguredInProduction,
  searchYouTubeVideos,
  type YouTubeSearchItem,
} from "../../lib/youtube-api";
import { classifyYoutubeLink, extractYoutubeVideoId } from "../../lib/youtube-link";
import { parseVideoUrl } from "../../lib/video-url";
import {
  ensureYoutubeChannel,
  filterVideosNotInLibrary,
  importAllChannelVideos,
  refreshChannelVideoList,
  type ChannelVideoItem,
} from "../../services/channels";
import type { YoutubeChannel } from "../../types";
import { addVideo } from "../../services/videos";
import { SearchResultAddButton } from "../SearchResultAddButton";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ChannelVideoManager } from "./ChannelVideoManager";
import { ImportProgressBanner } from "./ImportProgressBanner";

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "searching"; query: string }
  | { status: "search"; query: string; results: YouTubeSearchItem[] }
  | { status: "error"; message: string }
  | {
      status: "video";
      videoId: string;
      title: string;
      thumbnail: string;
      channelTitle: string;
    }
  | {
      status: "channel";
      sourceUrl: string;
      channelTitle: string;
      channelThumbnail?: string;
      videos: ChannelVideoItem[];
    };

interface YoutubeLinkImportProps {
  childIds: string[];
  hasChildren: boolean;
  libraryEmbedIds?: Set<string>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onLibraryChange?: () => void;
}

export function YoutubeLinkImport({
  childIds,
  hasChildren,
  libraryEmbedIds,
  onError,
  onSuccess,
  onLibraryChange,
}: YoutubeLinkImportProps) {
  const { online, checking, refresh: refreshAgent } = useYoutubeAgent();
  const [link, setLink] = useState("");
  const debouncedLink = useDebouncedValue(link, 600);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [videoTitle, setVideoTitle] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [activeChannel, setActiveChannel] = useState<YoutubeChannel | null>(null);
  const [channelVideos, setChannelVideos] = useState<ChannelVideoItem[]>([]);
  const [refreshingChannel, setRefreshingChannel] = useState(false);
  const lastAnalyzed = useRef("");
  const searchAbort = useRef<AbortController | null>(null);

  const analyzeLink = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) {
        searchAbort.current?.abort();
        setPreview({ status: "idle" });
        setActiveChannel(null);
        setChannelVideos([]);
        return;
      }

      const kind = classifyYoutubeLink(trimmed);
      if (kind === "invalid") {
        // Não é URL: trata como busca textual no YouTube
        if (trimmed.length < 2) {
          setPreview({ status: "idle" });
          return;
        }
        if (online === false) {
          setPreview({ status: "error", message: getAgentOfflineHelp() });
          return;
        }
        searchAbort.current?.abort();
        const controller = new AbortController();
        searchAbort.current = controller;
        setPreview({ status: "searching", query: trimmed });
        onError("");
        onSuccess("");
        try {
          const results = await searchYouTubeVideos(trimmed, 12, controller.signal);
          if (controller.signal.aborted) return;
          setPreview({ status: "search", query: trimmed, results });
          setActiveChannel(null);
          setChannelVideos([]);
        } catch (err) {
          if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
            return;
          }
          setPreview({
            status: "error",
            message: err instanceof Error ? err.message : "Não foi possível buscar no YouTube.",
          });
        }
        return;
      }

      if (kind === "channel" && online === false) {
        setPreview({
          status: "error",
          message: getAgentOfflineHelp(),
        });
        return;
      }

      setPreview({ status: "loading" });
      onError("");
      onSuccess("");

      try {
        if (kind === "video") {
          const videoId = extractYoutubeVideoId(trimmed);
          if (!videoId) throw new Error("ID do vídeo inválido.");
          const parsed = parseVideoUrl(trimmed);
          const details =
            online === true
              ? await getYouTubeVideoDetails(videoId).catch(() => null)
              : null;
          const title = details?.title ?? "";
          const thumbnail =
            details?.thumbnail ?? parsed?.thumbnail ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          setVideoTitle(title);
          setPreview({
            status: "video",
            videoId,
            title: title || "Vídeo do YouTube",
            thumbnail,
            channelTitle: details?.channelTitle ?? "",
          });
          setActiveChannel(null);
          setChannelVideos([]);
          return;
        }

        const payload = await fetchChannelFromAgent(trimmed, CHANNEL_IMPORT_VIDEO_LIMIT);
        const videos: ChannelVideoItem[] = payload.videos.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          thumbnail: v.thumbnail,
          channelId: v.channelId || payload.youtubeChannelId,
          channelTitle: v.channelTitle || payload.title,
        }));

        setPreview({
          status: "channel",
          sourceUrl: trimmed,
          channelTitle: payload.title,
          channelThumbnail: payload.thumbnail,
          videos,
        });
        setChannelVideos(videos);
        setActiveChannel(null);
        setVideoTitle("");
      } catch (err) {
        setPreview({
          status: "error",
          message: err instanceof Error ? err.message : "Não foi possível carregar o link.",
        });
      }
    },
    [online, onError, onSuccess]
  );

  useEffect(() => {
    if (checking) return;
    if (debouncedLink === lastAnalyzed.current) return;
    lastAnalyzed.current = debouncedLink;
    void analyzeLink(debouncedLink);
  }, [debouncedLink, analyzeLink, checking]);

  useEffect(() => {
    if (online !== true || !debouncedLink.trim()) return;
    lastAnalyzed.current = "";
    void analyzeLink(debouncedLink);
  }, [online, debouncedLink, analyzeLink]);

  const handlePublishVideo = async () => {
    if (!hasChildren || childIds.length === 0) {
      onError("Selecione pelo menos um perfil infantil.");
      return;
    }
    if (preview.status !== "video") return;

    const watchUrl = `https://www.youtube.com/watch?v=${preview.videoId}`;
    setPublishing(true);
    onError("");
    onSuccess("");
    try {
      await addVideo(watchUrl, videoTitle.trim() || preview.title, childIds);
      onSuccess("Vídeo publicado na biblioteca.");
      setLink("");
      setPreview({ status: "idle" });
      lastAnalyzed.current = "";
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao publicar vídeo.");
    } finally {
      setPublishing(false);
    }
  };

  const handleImportAll = async () => {
    if (!hasChildren || childIds.length === 0) {
      onError("Selecione pelo menos um perfil infantil.");
      return;
    }
    if (preview.status !== "channel") return;

    setPublishing(true);
    onError("");
    onSuccess("");
      setImportProgress({ current: 0, total: 1, title: "Buscando vídeos do canal…" });

    try {
      const { channel, videos } = await ensureYoutubeChannel(preview.sourceUrl, childIds);
      setActiveChannel(channel);
      setChannelVideos(videos);

      const notInLibrary = await filterVideosNotInLibrary(videos, childIds);
      const batchSize = Math.min(notInLibrary.length, CHANNEL_IMPORT_VIDEO_LIMIT);
      if (batchSize === 0) {
        onSuccess("Canal registrado. Todos os vídeos deste lote já estão na biblioteca.");
        return;
      }

      setImportProgress({ current: 0, total: batchSize, title: "" });

      const { imported } = await importAllChannelVideos(
        channel.id,
        videos,
        childIds,
        (current, total, title) => {
          setImportProgress({ current, total, title });
        }
      );

      setImportProgress(null);
      onSuccess(
        imported > 0
          ? `${imported} vídeo(s) adicionado(s) à biblioteca (até ${CHANNEL_IMPORT_VIDEO_LIMIT} por vez).`
          : "Canal carregado — todos os vídeos deste lote já estavam na biblioteca."
      );
    } catch (err) {
      setImportProgress(null);
      onError(err instanceof Error ? err.message : "Erro ao importar vídeos do canal.");
    } finally {
      setPublishing(false);
    }
  };

  const clearLink = () => {
    searchAbort.current?.abort();
    setLink("");
    setPreview({ status: "idle" });
    setActiveChannel(null);
    setChannelVideos([]);
    setImportProgress(null);
    lastAnalyzed.current = "";
    onError("");
    onSuccess("");
  };

  const handlePickSearchResult = (item: YouTubeSearchItem) => {
    const url = `https://www.youtube.com/watch?v=${item.videoId}`;
    searchAbort.current?.abort();
    setLink(url);
    lastAnalyzed.current = url;
    void analyzeLink(url);
  };

  const isBusy = publishing || preview.status === "loading" || checking;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          label="Link do YouTube ou busca por palavra"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Cole um link OU digite uma palavra para buscar (ex: peppa pig)"
          disabled={isBusy && !importProgress}
        />
        {link.trim() ? (
          <button
            type="button"
            onClick={clearLink}
            className="absolute right-2 top-9 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Limpar link"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Cole o link de um <strong className="text-slate-400">vídeo</strong>, de um{" "}
        <strong className="text-slate-400">canal</strong>, ou digite uma{" "}
        <strong className="text-slate-400">palavra</strong> para buscar no YouTube.
        {checking ? (
          <span className="mt-1 block text-slate-400">Verificando agente…</span>
        ) : online === false ? (
          <span className="mt-1 block text-amber-400/90">
            {getAgentOfflineHelp()}{" "}
            <button
              type="button"
              onClick={() => {
                lastAnalyzed.current = "";
                void refreshAgent().then(() => analyzeLink(link));
              }}
              className="underline hover:text-amber-200"
            >
              Tentar novamente
            </button>
          </span>
        ) : isAgentMisconfiguredInProduction() ? (
          <span className="mt-1 block text-red-400/90">{getAgentOfflineHelp()}</span>
        ) : null}
      </p>

      {importProgress ? (
        <ImportProgressBanner
          current={importProgress.current}
          total={importProgress.total}
          title={importProgress.title}
          label="Adicionando à biblioteca"
        />
      ) : null}

      {publishing && !importProgress && preview.status === "channel" ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/20 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          <span className="text-sm text-slate-300">Aguarde…</span>
        </div>
      ) : null}

      {preview.status === "loading" || checking ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/20 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <span className="text-sm text-slate-300">Analisando link… aguarde</span>
        </div>
      ) : null}

      {preview.status === "searching" ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/20 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          <span className="text-sm text-slate-300">
            Buscando “{preview.query}” no YouTube…
          </span>
        </div>
      ) : null}

      {preview.status === "search" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
            <Search className="h-4 w-4" />
            Resultados para “{preview.query}” ({preview.results.length})
          </div>
          {preview.results.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
              Nenhum vídeo encontrado. Refine a busca ou cole um link direto.
            </p>
          ) : (
            <ul className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2">
              {preview.results.map((item) => (
                <li key={item.videoId}>
                  <div className="flex w-full items-center gap-2 rounded-lg p-2 transition hover:bg-white/10">
                    <button
                      type="button"
                      onClick={() => handlePickSearchResult(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none"
                    >
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="h-14 w-24 shrink-0 rounded-md object-cover bg-slate-800"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-white">
                          {item.title}
                        </p>
                        {item.channelTitle ? (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {item.channelTitle}
                          </p>
                        ) : null}
                      </div>
                    </button>
                    <SearchResultAddButton
                      item={item}
                      childIds={childIds}
                      alreadyInLibrary={libraryEmbedIds?.has(item.videoId) ?? false}
                      size="sm"
                      onAdded={() => {
                        onSuccess(`“${item.title}” adicionado à biblioteca.`);
                        onLibraryChange?.();
                      }}
                      onError={onError}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {preview.status === "error" ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {preview.message}
        </p>
      ) : null}

      {preview.status === "video" ? (
        <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
            <Film className="h-4 w-4" />
            Vídeo detectado
          </div>
          <div className="flex gap-4">
            <img
              src={preview.thumbnail}
              alt=""
              className="h-24 w-40 shrink-0 rounded-lg object-cover bg-slate-800"
            />
            <div className="min-w-0">
              <p className="line-clamp-3 font-medium text-white">{preview.title}</p>
              {preview.channelTitle ? (
                <p className="mt-1 text-xs text-slate-400">{preview.channelTitle}</p>
              ) : null}
            </div>
          </div>
          <Input
            label="Título na biblioteca (opcional)"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder={preview.title}
          />
          <Button
            type="button"
            loading={publishing}
            disabled={!hasChildren || !childIds.length}
            onClick={handlePublishVideo}
          >
            Publicar este vídeo
          </Button>
        </div>
      ) : null}

      {preview.status === "channel" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              {preview.channelThumbnail ? (
                <img
                  src={preview.channelThumbnail}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <Tv className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
                Canal detectado
              </p>
              <p className="mt-1 font-semibold text-white">{preview.channelTitle}</p>
              <p className="mt-1 text-sm text-slate-400">
                {preview.videos.length} vídeo(s) na prévia (máx. {CHANNEL_IMPORT_VIDEO_LIMIT})
              </p>
            </div>
          </div>

          <ul className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2">
            {preview.videos.map((item, index) => (
              <li
                key={item.videoId}
                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5"
              >
                <span className="w-6 shrink-0 text-center text-xs tabular-nums text-slate-500">
                  {index + 1}
                </span>
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-12 w-20 shrink-0 rounded-md object-cover bg-slate-800"
                />
                <p className="line-clamp-2 min-w-0 flex-1 text-sm text-white">{item.title}</p>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            loading={publishing && !importProgress}
            disabled={!hasChildren || !childIds.length || publishing}
            onClick={handleImportAll}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Importar tudo ({Math.min(preview.videos.length, CHANNEL_IMPORT_VIDEO_LIMIT)} vídeos)
          </Button>
        </div>
      ) : null}

      {activeChannel && channelVideos.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white">
            Gerenciar: {activeChannel.title}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Adicione ou remova vídeos um a um, ou use importar tudo novamente.
          </p>
          <div className="mt-4">
            <ChannelVideoManager
              catalogChannelId={activeChannel.id}
              channelTitle={activeChannel.title}
              childIds={childIds}
              agentVideos={channelVideos}
              showOpenChannel
              onRefreshAgent={async () => {
                setRefreshingChannel(true);
                try {
                  const list = await refreshChannelVideoList(activeChannel.id);
                  setChannelVideos(list);
                } finally {
                  setRefreshingChannel(false);
                }
              }}
              refreshing={refreshingChannel}
            />
          </div>
          <Link
            to={`/gestor/canal/${activeChannel.id}`}
            className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Abrir página do canal →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
