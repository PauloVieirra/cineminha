import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { platformLabel } from "../../lib/video-url";
import type { Video } from "../../types";

interface FeaturedHeroProps {
  videos: Video[];
  activeId: string;
  onSelect: (id: string) => void;
  onPlay: (id: string) => void;
}

export function FeaturedHero({ videos, activeId, onSelect, onPlay }: FeaturedHeroProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const active = videos.find((v) => v.id === activeId) ?? videos[0];

  useEffect(() => {
    const el = sliderRef.current?.querySelector(`[data-video-id="${activeId}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  if (!active) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {active.thumbnail ? (
          <img
            src={active.thumbnail}
            alt=""
            className="h-full w-full scale-105 object-cover blur-sm brightness-[0.35]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/70 to-[#0a0e17]/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-6 sm:pt-10">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 max-w-2xl sm:mb-8"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Em destaque
          </p>
          <h1 className="mt-2 text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-4xl">
            {active.title}
          </h1>
          <span className="mt-3 inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {platformLabel(active.platform)}
          </span>
        </motion.div>

        <div className="relative -mx-4 sm:-mx-6">
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-[#0a0e17] to-transparent sm:w-16"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-[#0a0e17] to-transparent sm:w-16"
            aria-hidden
          />

          <div
            ref={sliderRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 pt-1 scroll-smooth sm:gap-5 sm:px-6"
            role="list"
            aria-label="Vídeos em destaque"
          >
            {videos.map((video) => {
              const isActive = video.id === activeId;
              return (
                <button
                  key={video.id}
                  type="button"
                  data-video-id={video.id}
                  role="listitem"
                  onClick={() => onSelect(video.id)}
                  onDoubleClick={() => onPlay(video.id)}
                  className={`
                    group relative w-[min(78vw,320px)] shrink-0 snap-center overflow-hidden rounded-2xl
                    transition-all duration-300 sm:w-[280px] md:w-[300px]
                    ${isActive ? "ring-[3px] ring-white ring-offset-2 ring-offset-transparent scale-[1.02]" : "opacity-75 hover:opacity-95"}
                  `}
                >
                  <div className="aspect-video w-full bg-slate-800">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🎬</div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 truncate text-left text-sm font-semibold text-white">
                    {video.title}
                  </p>
                  {isActive ? (
                    <button
                      type="button"
                      className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/40 transition hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(video.id);
                      }}
                      aria-label={`Assistir ${video.title}`}
                    >
                      <Play className="h-7 w-7 fill-current pl-0.5" />
                    </button>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pb-6 sm:hidden">
          <button
            type="button"
            onClick={() => onPlay(active.id)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/30"
          >
            <Play className="h-5 w-5 fill-current" />
            Assistir agora
          </button>
        </div>
      </div>
    </section>
  );
}
