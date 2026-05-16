import { motion } from "framer-motion";
import { VideoCard } from "../VideoCard";
import type { Video } from "../../types";

interface LibraryGridProps {
  videos: Video[];
  onSelect: (id: string) => void;
  searchQuery: string;
}

export function LibraryGrid({ videos, onSelect, searchQuery }: LibraryGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-4 font-medium text-slate-300">
          {searchQuery ? "Nenhum vídeo encontrado" : "Sua biblioteca está vazia"}
        </p>
        {searchQuery ? (
          <p className="mt-2 text-sm text-slate-500">Tente outro termo de busca</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Peça ao gestor para adicionar vídeos ao seu perfil</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
      {videos.map((video, i) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.4) }}
        >
          <VideoCard video={video} onClick={() => onSelect(video.id)} />
        </motion.div>
      ))}
    </div>
  );
}
