import { ArrowLeft, Tv } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChildHeader } from "../components/child/ChildHeader";
import { LibraryGrid } from "../components/child/LibraryGrid";
import { useAsyncData } from "../hooks/useAsyncData";
import { filterVideosByQuery } from "../lib/search";
import { getChild } from "../services/children";
import { listChannelsForChild } from "../services/channels";
import { listVideosForChild } from "../services/videos";

export function ChildChannelPage() {
  const { childId, channelId } = useParams<{ childId: string; channelId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: child } = useAsyncData(
    () => (childId ? getChild(childId) : Promise.resolve(undefined)),
    [childId]
  );
  const { data: channels } = useAsyncData(
    () => (childId ? listChannelsForChild(childId) : Promise.resolve([])),
    [childId]
  );
  const channel = channels?.find((c) => c.id === channelId);

  const { data: videos } = useAsyncData(async () => {
    if (!childId) return [];
    const all = await listVideosForChild(childId);
    return channelId ? all.filter((v) => v.catalogChannelId === channelId) : all;
  }, [childId, channelId]);

  const filtered = useMemo(
    () => filterVideosByQuery(videos ?? [], searchQuery),
    [videos, searchQuery]
  );

  const goBack = () => navigate(`/assistir/${childId}`);

  if (!childId || !channelId) {
    navigate("/");
    return null;
  }

  if (channel && childId && !channel.childIds.includes(childId)) {
    navigate(`/assistir/${childId}`, { replace: true });
    return null;
  }

  if (!child) {
    return (
      <div className="gradient-mesh flex min-h-dvh items-center justify-center text-slate-400">
        Carregando…
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-dvh pb-12">
      <ChildHeader
        child={child}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onHome={goBack}
      />

      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {channel ? (
          <div className="mb-8 flex items-center gap-4 rounded-2xl glass p-4">
            {channel.thumbnail ? (
              <img
                src={channel.thumbnail}
                alt=""
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800">
                <Tv className="h-8 w-8 text-slate-500" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{channel.title}</h1>
              <p className="text-sm text-slate-400">{filtered.length} vídeo(s)</p>
            </div>
          </div>
        ) : null}

        <LibraryGrid
          videos={filtered}
          searchQuery={searchQuery}
          onSelect={(id) => navigate(`/assistir/${childId}/video/${id}`)}
        />
      </main>
    </div>
  );
}
