import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { platformLabel } from "../lib/video-url";
import type { Video } from "../types";

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  featured?: boolean;
}

export function VideoCard({ video, onClick, featured }: VideoCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group w-full text-left"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl bg-slate-800
          ${featured ? "aspect-[16/10]" : "aspect-[2/3]"}
        `}
      >
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-4xl">
            🎬
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50">
            <Play className="h-6 w-6 fill-current" />
          </span>
        </div>
        {featured ? (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white">{video.title}</h3>
            <span className="mt-1 inline-block rounded-full border border-white/20 px-2 py-0.5 text-xs text-slate-300">
              {platformLabel(video.platform)}
            </span>
          </div>
        ) : null}
      </div>
      {!featured ? (
        <div className="mt-3 space-y-1">
          <h3 className="line-clamp-2 font-semibold text-white">{video.title}</h3>
          <span className="inline-block rounded-full border border-white/15 px-2 py-0.5 text-xs text-slate-400">
            {platformLabel(video.platform)}
          </span>
        </div>
      ) : null}
    </motion.button>
  );
}
