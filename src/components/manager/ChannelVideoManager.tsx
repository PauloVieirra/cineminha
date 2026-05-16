import { Download, Loader2, Minus, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { Link } from "react-router-dom";
import { CHANNEL_IMPORT_VIDEO_LIMIT } from "../../lib/youtube-api";
import {
  addVideoToChannelLibrary,
  filterVideosNotInLibrary,
  importAllChannelVideos,
  listVideosForCatalogChannel,
  removeVideoFromChannelLibrary,
  type ChannelVideoItem,
} from "../../services/channels";
import type { Video } from "../../types";
import { Button } from "../ui/Button";
import { ImportProgressBanner } from "./ImportProgressBanner";

interface ChannelVideoManagerProps {
  catalogChannelId: string;
  channelTitle?: string;
  childIds: string[];
  agentVideos: ChannelVideoItem[];
  onRefreshAgent?: () => Promise<void>;
  refreshing?: boolean;
  showOpenChannel?: boolean;
}

export function ChannelVideoManager({
  catalogChannelId,
  channelTitle,
  childIds,
  agentVideos,
  onRefreshAgent,
  refreshing = false,
  showOpenChannel = false,
}: ChannelVideoManagerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    title: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingVideos, setPendingVideos] = useState<ChannelVideoItem[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const childIdsKey = useMemo(() => childIds.join(","), [childIds]);

  const { data: libraryVideos, reload: reloadLibrary } = useAsyncData(
    () => listVideosForCatalogChannel(catalogChannelId),
    [catalogChannelId, agentVideos.length]
  );

  const refreshPending = useCallback(async () => {
    if (!agentVideos.length) {
      setPendingVideos([]);
      setPendingLoading(false);
      return;
    }
    if (!childIds.length) {
      setPendingVideos([...agentVideos]);
      setPendingLoading(false);
      return;
    }
    setPendingLoading(true);
    try {
      const list = await filterVideosNotInLibrary(agentVideos, childIds);
      setPendingVideos(list);
    } catch {
      setPendingVideos([...agentVideos]);
    } finally {
      setPendingLoading(false);
    }
  }, [agentVideos, childIdsKey, childIds.length]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending, libraryVideos]);

  const pendingCount = pendingVideos.length;
  const libraryCount = libraryVideos?.length ?? 0;
  const addAllCount = Math.min(pendingCount, CHANNEL_IMPORT_VIDEO_LIMIT);

  const handleAddOne = async (item: ChannelVideoItem) => {
    if (!childIds.length) {
      setError("Selecione pelo menos um perfil infantil acima.");
      return;
    }
    setBusyId(item.videoId);
    setError("");
    setMessage("");
    try {
      await addVideoToChannelLibrary(catalogChannelId, item, childIds);
      setMessage(`"${item.title}" adicionado.`);
      await refreshPending();
      void reloadLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAddAll = async () => {
    if (!childIds.length) {
      setError("Selecione pelo menos um perfil infantil acima.");
      return;
    }
    if (!agentVideos.length) {
      setError("Nenhum vídeo na lista. Clique em Atualizar lista.");
      return;
    }
    setBulkLoading(true);
    setError("");
    setMessage("");
    setImportProgress(null);
    try {
      const notInLibrary = await filterVideosNotInLibrary(agentVideos, childIds);
      const batchSize = Math.min(notInLibrary.length, CHANNEL_IMPORT_VIDEO_LIMIT);
      if (batchSize === 0) {
        setMessage("Todos os vídeos deste lote já estão na biblioteca.");
        return;
      }
      setImportProgress({ current: 0, total: batchSize, title: "" });

      const { imported } = await importAllChannelVideos(
        catalogChannelId,
        agentVideos,
        childIds,
        (current, total, title) => {
          setImportProgress({ current, total, title });
        }
      );
      setImportProgress(null);
      if (imported === 0) {
        setMessage("Todos os vídeos deste lote já estão na biblioteca.");
      } else {
        setMessage(`${imported} vídeo(s) adicionado(s) à biblioteca (máx. ${CHANNEL_IMPORT_VIDEO_LIMIT} por vez).`);
      }
      await refreshPending();
      void reloadLibrary();
    } catch (err) {
      setImportProgress(null);
      setError(err instanceof Error ? err.message : "Erro ao adicionar em lote.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRemove = async (item: ChannelVideoItem) => {
    if (!childIds.length) {
      setError("Selecione pelo menos um perfil infantil acima.");
      return;
    }
    setBusyId(item.videoId);
    setError("");
    setMessage("");
    try {
      await removeVideoFromChannelLibrary(catalogChannelId, item.videoId, childIds);
      setMessage(`"${item.title}" removido da biblioteca.`);
      await refreshPending();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveLibrary = async (video: Video) => {
    const ids = childIds.length ? childIds : video.childIds;
    setBusyId(video.id);
    setError("");
    setMessage("");
    try {
      await removeVideoFromChannelLibrary(
        catalogChannelId,
        video.embedId ?? "",
        ids
      );
      setMessage(`"${video.title}" removido da biblioteca.`);
      await refreshPending();
      void reloadLibrary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {importProgress ? (
        <ImportProgressBanner
          current={importProgress.current}
          total={importProgress.total}
          title={importProgress.title}
        />
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      ) : null}

      {!childIds.length ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Selecione um ou mais perfis infantis acima para habilitar Adicionar e Remover.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">
          {channelTitle ? (
            <>
              Canal <strong className="text-white">{channelTitle}</strong> ·{" "}
            </>
          ) : null}
          <span className="text-slate-400">
            {pendingCount} para adicionar · {libraryCount} na biblioteca
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {onRefreshAgent ? (
            <Button
              type="button"
              variant="secondary"
              loading={refreshing}
              onClick={() => onRefreshAgent()}
              className="text-xs"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar lista
            </Button>
          ) : null}
          <Button
            type="button"
            loading={bulkLoading}
            disabled={!childIds.length || !pendingCount || bulkLoading}
            onClick={handleAddAll}
            className="text-xs"
          >
            <Download className="h-4 w-4" />
            Adicionar tudo ({addAllCount || CHANNEL_IMPORT_VIDEO_LIMIT})
          </Button>
          {showOpenChannel ? (
            <Link
              to={`/gestor/canal/${catalogChannelId}`}
              className="inline-flex items-center rounded-xl glass px-3 py-2 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Página do canal →
            </Link>
          ) : null}
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Vídeos do canal — adicionar à biblioteca
        </h3>

        {!agentVideos.length ? (
          <div className="rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-slate-400">
            Nenhum vídeo listado. Confirme o agente (<code className="text-emerald-400">npm run agent</code>)
            e clique em Atualizar lista.
          </div>
        ) : pendingLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando lista…</span>
          </div>
        ) : pendingCount === 0 ? (
          <p className="rounded-xl glass py-6 text-center text-sm text-slate-400">
            Todos os vídeos deste lote já estão na biblioteca. Novos uploads aparecem após
            Atualizar lista.
          </p>
        ) : (
          <ul className="max-h-[min(55vh,480px)] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-2">
            {pendingVideos.map((item) => {
              const loading = busyId === item.videoId;
              return (
                <li
                  key={item.videoId}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5"
                >
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded-lg object-cover bg-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-white">{item.title}</p>
                  </div>
                  <Button
                    type="button"
                    className="shrink-0 px-3 py-2 text-xs"
                    disabled={loading || !childIds.length}
                    onClick={() => handleAddOne(item)}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {libraryCount > 0 ? (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Já na biblioteca — remover se quiser
          </h3>
          <ul className="max-h-[min(40vh,360px)] space-y-2 overflow-y-auto">
            {(libraryVideos ?? []).map((video) => {
              const loading = busyId === video.id;
              const inCurrentBatch = agentVideos.some((a) => a.videoId === video.embedId);
              return (
                <li
                  key={video.id}
                  className="flex items-center gap-3 rounded-xl glass p-3 ring-1 ring-emerald-500/15"
                >
                  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">🎬</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-white">{video.title}</p>
                    {!inCurrentBatch ? (
                      <p className="mt-0.5 text-xs text-slate-500">Importado antes</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    className="shrink-0 px-3 py-2 text-xs"
                    disabled={loading || !childIds.length}
                    onClick={() =>
                      inCurrentBatch && video.embedId
                        ? handleRemove({
                            videoId: video.embedId,
                            title: video.title,
                            thumbnail: video.thumbnail ?? "",
                            channelId: video.channelId ?? "",
                            channelTitle: video.channelTitle ?? "",
                          })
                        : handleRemoveLibrary(video)
                    }
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Minus className="h-4 w-4" />
                        Remover
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
