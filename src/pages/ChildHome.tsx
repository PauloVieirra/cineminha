import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChildHeader } from "../components/child/ChildHeader";
import { ChildYoutubeSearch } from "../components/child/ChildYoutubeSearch";
import { FeaturedHero } from "../components/child/FeaturedHero";
import { LibraryGrid } from "../components/child/LibraryGrid";
import { filterVideosByQuery, orderVideosForHero } from "../lib/search";
import { clearActiveChild } from "../lib/auth";
import { ChannelCard } from "../components/ChannelCard";
import { useAsyncData } from "../hooks/useAsyncData";
import { getChild } from "../services/children";
import { listChannelsForChild } from "../services/channels";
import { listVideosForChild } from "../services/videos";

export function ChildHome() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHeroId, setActiveHeroId] = useState<string>("");

  const { data: child } = useAsyncData(
    () => (childId ? getChild(childId) : Promise.resolve(undefined)),
    [childId]
  );
  const { data: library } = useAsyncData(
    () => (childId ? listVideosForChild(childId) : Promise.resolve([])),
    [childId]
  );
  const { data: channelsWithCounts } = useAsyncData(async () => {
    if (!childId) return [];
    const chs = await listChannelsForChild(childId);
    const allVideos = await listVideosForChild(childId);
    return chs.map((channel) => ({
      channel,
      videoCount: allVideos.filter((v) => v.catalogChannelId === channel.id).length,
    }));
  }, [childId]);

  const filtered = useMemo(
    () => filterVideosByQuery(library ?? [], searchQuery),
    [library, searchQuery]
  );

  const heroVideos = useMemo(
    () => orderVideosForHero(filtered, child?.featuredVideoId),
    [filtered, child?.featuredVideoId]
  );

  useEffect(() => {
    if (!heroVideos.length) {
      setActiveHeroId("");
      return;
    }
    if (!heroVideos.some((v) => v.id === activeHeroId)) {
      setActiveHeroId(heroVideos[0].id);
    }
  }, [heroVideos, activeHeroId]);

  const goHub = () => {
    clearActiveChild();
    navigate("/perfis");
  };

  const playVideo = (id: string) => {
    navigate(`/assistir/${childId}/video/${id}`);
  };

  const playYoutube = (videoId: string) => {
    navigate(`/assistir/${childId}/yt/${videoId}`);
  };

  if (!childId) {
    navigate("/");
    return null;
  }

  if (!child) {
    return (
      <div className="gradient-mesh flex min-h-dvh items-center justify-center text-slate-400">
        Carregando perfil…
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-dvh pb-12">
      <ChildHeader
        child={child}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onHome={goHub}
      />

      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {heroVideos.length > 0 ? (
          <FeaturedHero
            videos={heroVideos}
            activeId={activeHeroId}
            onSelect={setActiveHeroId}
            onPlay={playVideo}
          />
        ) : null}

        {channelsWithCounts && channelsWithCounts.length > 0 ? (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-white">Meus canais</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {channelsWithCounts.map(({ channel, videoCount }) => (
                <div key={channel.id} className="w-56 shrink-0">
                  <ChannelCard
                    channel={channel}
                    videoCount={videoCount}
                    onClick={() => navigate(`/assistir/${childId}/canal/${channel.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {child.isAdult ? (
          <ChildYoutubeSearch
            onPlay={(item) => playYoutube(item.videoId)}
          />
        ) : null}

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-white">Minha biblioteca</h2>
          <LibraryGrid
            videos={filtered}
            searchQuery={searchQuery}
            onSelect={playVideo}
          />
        </section>
      </main>
    </div>
  );
}
