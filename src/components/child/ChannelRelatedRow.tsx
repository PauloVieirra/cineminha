import { Play } from "lucide-react";
import type { YouTubeSearchItem } from "../../lib/youtube-api";

interface ChannelRelatedRowProps {
  channelTitle?: string;
  items: YouTubeSearchItem[];
  activeYoutubeId?: string;
  libraryByYoutubeId: Map<string, string>;
  onSelectYoutube: (item: YouTubeSearchItem) => void;
  onSelectLibrary: (videoId: string) => void;
}

export function ChannelRelatedRow({
  channelTitle,
  items,
  activeYoutubeId,
  libraryByYoutubeId,
  onSelectYoutube,
  onSelectLibrary,
}: ChannelRelatedRowProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        📺 Mais do canal
      </p>
      <h2 className="mt-1 text-lg font-bold text-white">
        {channelTitle ?? "Vídeos relacionados"}
      </h2>

      <div className="relative -mx-4 mt-4 sm:-mx-6">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-[#0a0e17] to-transparent sm:w-12" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-[#0a0e17] to-transparent sm:w-12" />

        <div
          className="scrollbar-hide flex gap-3 overflow-x-auto px-4 scroll-smooth snap-x snap-mandatory sm:gap-4 sm:px-6"
          role="list"
        >
          {items.map((item) => {
            const libraryId = libraryByYoutubeId.get(item.videoId);
            const isActive = activeYoutubeId === item.videoId;

            return (
              <button
                key={item.videoId}
                type="button"
                role="listitem"
                onClick={() => {
                  if (libraryId) onSelectLibrary(libraryId);
                  else onSelectYoutube(item);
                }}
                className={`
                  w-[min(70vw,220px)] shrink-0 snap-center overflow-hidden rounded-xl text-left transition
                  ${isActive ? "ring-2 ring-emerald-400" : "opacity-90 hover:opacity-100"}
                `}
              >
                <div className="relative aspect-video bg-slate-800">
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                      <Play className="h-4 w-4 fill-current" />
                    </span>
                  </div>
                  {libraryId ? (
                    <span className="absolute right-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-slate-950">
                      Na biblioteca
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-2 p-2 text-xs font-medium text-slate-200">{item.title}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
