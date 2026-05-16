import { motion } from "framer-motion";
import { Tv } from "lucide-react";
import type { YoutubeChannel } from "../types";

interface ChannelCardProps {
  channel: YoutubeChannel;
  videoCount: number;
  onClick: () => void;
}

export function ChannelCard({ channel, videoCount, onClick }: ChannelCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group w-full overflow-hidden rounded-2xl glass text-left transition hover:bg-white/5"
    >
      <div className="relative aspect-[16/9] bg-slate-800">
        {channel.thumbnail ? (
          <img
            src={channel.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tv className="h-12 w-12 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="line-clamp-2 font-bold text-white">{channel.title}</h3>
          <p className="mt-1 text-xs text-slate-300">
            {videoCount} vídeo{videoCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
