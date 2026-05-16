import { ArrowLeft, Loader2, RefreshCw, Trash2, Tv } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChannelVideoManager } from "../components/manager/ChannelVideoManager";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/Button";
import { useAsyncData } from "../hooks/useAsyncData";
import { listChildren } from "../services/children";
import {
  deleteChannel,
  getChannel,
  listVideosForCatalogChannel,
  refreshChannelVideoList,
  type ChannelVideoItem,
} from "../services/channels";

export function ManagerChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(true);
  const [error, setError] = useState("");
  const [agentError, setAgentError] = useState("");
  const [agentVideos, setAgentVideos] = useState<ChannelVideoItem[]>([]);
  const [importChildIds, setImportChildIds] = useState<string[]>([]);

  const { data: channel } = useAsyncData(
    () => (channelId ? getChannel(channelId) : Promise.resolve(undefined)),
    [channelId]
  );
  const { data: children } = useAsyncData(() => listChildren(), []);
  const { data: libraryVideos } = useAsyncData(
    () => (channelId ? listVideosForCatalogChannel(channelId) : Promise.resolve([])),
    [channelId]
  );

  const loadAgentVideos = useCallback(async (catalogId: string) => {
    setAgentLoading(true);
    setAgentError("");
    try {
      const list = await refreshChannelVideoList(catalogId);
      setAgentVideos(list);
      if (!list.length) {
        setAgentError(
          "Nenhum vídeo retornado. Reinicie o agente (npm run agent) e clique em Atualizar lista. Se o canal foi importado antes, remova e importe de novo."
        );
      }
    } catch (err) {
      setAgentVideos([]);
      setAgentError(
        err instanceof Error
          ? err.message
          : "Não foi possível listar vídeos. Inicie o agente com npm run agent."
      );
    } finally {
      setAgentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!channel?.id) return;
    void loadAgentVideos(channel.id);
  }, [channel?.id, channel?.sourceUrl, loadAgentVideos]);

  useEffect(() => {
    if (channel?.childIds.length) {
      setImportChildIds(channel.childIds);
    }
  }, [channel?.id, channel?.childIds.join(",")]);

  const toggleImportChild = (id: string) => {
    setImportChildIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRefresh = async () => {
    if (!channelId) return;
    setLoading(true);
    setError("");
    try {
      await loadAgentVideos(channelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar lista.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelId || !channel) return;
    if (!confirm(`Remover o canal "${channel.title}" e todos os vídeos da biblioteca dele?`)) return;
    await deleteChannel(channelId);
    navigate("/gestor");
  };

  if (!channelId) {
    navigate("/gestor");
    return null;
  }

  const inLibraryCount = libraryVideos?.length ?? 0;

  return (
    <PageShell>
      <Link
        to="/gestor"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>

      {channel ? (
        <>
          <div className="overflow-hidden rounded-2xl glass">
            <div className="relative aspect-[21/9] max-h-56 bg-slate-800 sm:max-h-72">
              {channel.thumbnail ? (
                <img
                  src={channel.thumbnail}
                  alt=""
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Tv className="h-16 w-16 text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Canal do YouTube
                </p>
                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{channel.title}</h1>
                <p className="mt-2 text-sm text-slate-400">
                  {inLibraryCount} na biblioteca · {agentVideos.length} no catálogo do canal
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleRefresh} loading={loading || agentLoading}>
              <RefreshCw className="h-4 w-4" />
              Atualizar lista do canal
            </Button>
            <Button variant="danger" onClick={handleDeleteChannel}>
              <Trash2 className="h-4 w-4" />
              Remover canal
            </Button>
          </div>

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {agentError && !agentLoading ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {agentError}
            </p>
          ) : null}

          {channel.description ? (
            <p className="mt-6 line-clamp-4 text-sm text-slate-400">{channel.description}</p>
          ) : null}

          {children && children.length > 0 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-300">Importar para os perfis</p>
              <div className="flex flex-wrap gap-2">
                {children
                  .filter((c) => channel.childIds.includes(c.id))
                  .map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleImportChild(child.id)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        importChildIds.includes(child.id)
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {child.emoji} {child.name}
                    </button>
                  ))}
              </div>
              {importChildIds.length === 0 ? (
                <p className="mt-2 text-sm text-amber-400">
                  Selecione ao menos um perfil para importar vídeos.
                </p>
              ) : null}
            </div>
          ) : null}

          {agentLoading ? (
            <div className="mt-10 flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando vídeos do canal…
            </div>
          ) : (
            <ChannelVideoManager
              catalogChannelId={channel.id}
              channelTitle={channel.title}
              childIds={importChildIds}
              agentVideos={agentVideos}
              onRefreshAgent={handleRefresh}
              refreshing={loading}
            />
          )}
        </>
      ) : (
        <div className="py-20 text-center text-slate-400">Carregando canal...</div>
      )}
    </PageShell>
  );
}
