import { useAsyncData } from "../hooks/useAsyncData";
import { AnimatePresence, motion } from "framer-motion";
import { History, Link2, LogOut, Plus, Star, Trash2, Users, Video } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AVATAR_COLORS, AVATAR_EMOJIS, type ChildProfile } from "../types";
import { clearAllSessions, getManagerSession } from "../lib/auth";
import { platformLabel } from "../lib/video-url";
import {
  createChild,
  deleteChild,
  listChildren,
  setChildFeaturedVideo,
} from "../services/children";
import { formatDate, formatDuration, listWatchHistory } from "../services/history";
import { getManagerById, logoutManager } from "../services/manager";
import { YoutubeLinkImport } from "../components/manager/YoutubeLinkImport";
import { listChannels } from "../services/channels";
import { deleteVideo, listVideos } from "../services/videos";

type Tab = "children" | "videos" | "history";

export function ManagerDashboard() {
  const navigate = useNavigate();
  const managerId = getManagerSession();
  const [tab, setTab] = useState<Tab>("videos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: manager } = useAsyncData(
    () => (managerId ? getManagerById(managerId) : Promise.resolve(undefined)),
    [managerId]
  );
  const { data: children, reload: reloadChildren } = useAsyncData(() => listChildren(), []);
  const { data: videos } = useAsyncData(() => listVideos(), []);
  const { data: channels } = useAsyncData(() => listChannels(), []);
  const { data: history } = useAsyncData(() => listWatchHistory({ limit: 100 }), []);

  const [childName, setChildName] = useState("");
  const [childColor, setChildColor] = useState<string>(AVATAR_COLORS[0]);
  const [childEmoji, setChildEmoji] = useState<string>(AVATAR_EMOJIS[0]);

  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [success, setSuccess] = useState("");

  const logout = async () => {
    await logoutManager();
    clearAllSessions();
    navigate("/");
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!childName.trim()) return;
    setLoading(true);
    try {
      await createChild(childName, childColor, childEmoji);
      setChildName("");
      void reloadChildren();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const toggleChildForVideo = (id: string) => {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredHistory =
    history?.filter((h) => historyFilter === "all" || h.childId === historyFilter) ?? [];

  const childNameById = (id: string) =>
    children?.find((c) => c.id === id)?.name ?? "Desconhecido";

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "children", label: "Perfis", icon: Users },
    { id: "videos", label: "Vídeos", icon: Video },
    { id: "history", label: "Histórico", icon: History },
  ];

  return (
    <PageShell className="pb-24 sm:pb-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Logo subtitle={manager ? `Olá, ${manager.name}` : "Gestão"} />
        <div className="flex items-center gap-2">
          <Link
            to="/perfis"
            className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:text-white"
          >
            Perfis
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl glass px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      <nav className="mb-8 flex gap-2 overflow-x-auto scrollbar-hide rounded-2xl glass p-1.5 sm:inline-flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`
              flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition
              ${tab === id ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}
            `}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {error ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </motion.p>
      ) : null}

      <AnimatePresence mode="wait">
        {tab === "children" && (
          <motion.div
            key="children"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <section className="rounded-2xl glass p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Plus className="h-5 w-5 text-emerald-400" />
                Novo perfil infantil
              </h2>
              <form onSubmit={handleAddChild} className="mt-4 space-y-4">
                <Input
                  label="Nome da criança"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Ex: Maria"
                  required
                />
                <div>
                  <p className="mb-2 text-sm text-slate-300">Avatar</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setChildEmoji(emoji)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                          childEmoji === emoji
                            ? "bg-emerald-500/30 ring-2 ring-emerald-400"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm text-slate-300">Cor</p>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setChildColor(color)}
                        className={`h-9 w-9 rounded-full transition ${
                          childColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label="Cor do perfil"
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" loading={loading}>
                  Criar perfil
                </Button>
              </form>
            </section>

            <section>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                Perfis cadastrados
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {children?.map((child: ChildProfile) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between rounded-2xl glass p-4"
                  >
                    <ProfileAvatar
                      name={child.name}
                      emoji={child.emoji}
                      color={child.avatarColor}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remover o perfil de ${child.name}?`)) {
                          deleteChild(child.id);
                        }
                      }}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                      aria-label="Remover perfil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {tab === "videos" && (
          <motion.div
            key="videos"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <section className="rounded-2xl glass p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Link2 className="h-5 w-5 text-emerald-400" />
                Adicionar vídeo ou canal
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Cole um link do YouTube — o site detecta se é{" "}
                <strong className="text-slate-300">vídeo</strong> ou{" "}
                <strong className="text-slate-300">canal</strong> e mostra a prévia antes de publicar.
              </p>

              {success ? <p className="mt-4 text-sm text-emerald-400">{success}</p> : null}

              {children && children.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-2 text-sm text-slate-300">
                    Adicionar à biblioteca de (obrigatório)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => toggleChildForVideo(child.id)}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                          selectedChildren.includes(child.id)
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {child.emoji} {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm text-amber-400">
                  Crie um perfil infantil antes de adicionar vídeos.
                </p>
              )}

              <div className="mt-6">
                <YoutubeLinkImport
                  childIds={selectedChildren}
                  hasChildren={Boolean(children?.length)}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              </div>
            </section>

            {channels && channels.length > 0 ? (
              <section>
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                  Canais importados ({channels.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {channels.map((ch) => (
                    <Link
                      key={ch.id}
                      to={`/gestor/canal/${ch.id}`}
                      className="flex gap-4 rounded-2xl glass p-4 transition hover:bg-white/5"
                    >
                      <img
                        src={ch.thumbnail}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover bg-slate-800"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{ch.title}</h3>
                        <p className="text-xs text-slate-500">
                          {ch.childIds.length} perfil(is)
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                Todos os vídeos ({videos?.length ?? 0})
              </h2>
              <div className="space-y-3">
                {videos?.map((video) => (
                  <div
                    key={video.id}
                    className="flex gap-4 rounded-2xl glass p-4"
                  >
                    <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">🎬</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{video.title}</h3>
                      <p className="text-xs text-slate-500">{platformLabel(video.platform)}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {video.childIds.map((cid) => {
                          const c = children?.find((ch) => ch.id === cid);
                          const isFeatured = c?.featuredVideoId === video.id;
                          return (
                            <button
                              key={cid}
                              type="button"
                              title={
                                isFeatured
                                  ? `Destaque de ${c?.name} (clique para remover)`
                                  : `Definir destaque no header de ${c?.name}`
                              }
                              onClick={async () => {
                                try {
                                  await setChildFeaturedVideo(
                                    cid,
                                    isFeatured ? null : video.id
                                  );
                                } catch (err) {
                                  setError(
                                    err instanceof Error ? err.message : "Erro ao definir destaque."
                                  );
                                }
                              }}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
                                isFeatured
                                  ? "bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/50"
                                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <Star
                                className={`h-3 w-3 ${isFeatured ? "fill-amber-400 text-amber-400" : ""}`}
                              />
                              {c?.emoji} {c?.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Remover este vídeo?")) deleteVideo(video.id);
                      }}
                      className="self-start rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {!videos?.length ? (
                  <p className="text-center text-slate-500 py-8">Nenhum vídeo cadastrado.</p>
                ) : null}
              </div>
            </section>
          </motion.div>
        )}

        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHistoryFilter("all")}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  historyFilter === "all" ? "bg-emerald-500 text-slate-950" : "glass text-slate-400"
                }`}
              >
                Todos
              </button>
              {children?.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setHistoryFilter(child.id)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    historyFilter === child.id
                      ? "bg-emerald-500 text-slate-950"
                      : "glass text-slate-400"
                  }`}
                >
                  {child.emoji} {child.name}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredHistory.map((session) => (
                <div key={session.id} className="rounded-2xl glass p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{session.videoTitle}</p>
                      <p className="text-sm text-slate-400">
                        {childNameById(session.childId)} · {formatDate(session.startedAt)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-emerald-400">{formatDuration(session.durationSeconds)}</span>
                      {session.completed ? (
                        <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                          Concluído
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {!filteredHistory.length ? (
                <p className="py-12 text-center text-slate-500">Nenhuma visualização registrada.</p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-white/10 bg-slate-950/95 px-2 py-3 backdrop-blur-lg sm:hidden">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 text-xs ${
              tab === id ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
    </PageShell>
  );
}
