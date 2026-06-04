import { Check, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import type { YouTubeSearchItem } from "../lib/youtube-api";
import { addYoutubeSearchItemToLibrary } from "../services/videos";

interface SearchResultAddButtonProps {
  item: YouTubeSearchItem;
  childIds: string[];
  alreadyInLibrary: boolean;
  onAdded?: () => void;
  onError?: (message: string) => void;
  size?: "sm" | "md";
}

export function SearchResultAddButton({
  item,
  childIds,
  alreadyInLibrary,
  onAdded,
  onError,
  size = "md",
}: SearchResultAddButtonProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(alreadyInLibrary);

  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (added || adding) return;
    if (childIds.length === 0) {
      onError?.("Selecione pelo menos um perfil.");
      return;
    }

    setAdding(true);
    try {
      await addYoutubeSearchItemToLibrary(item, childIds);
      setAdded(true);
      onAdded?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Erro ao adicionar à biblioteca.");
    } finally {
      setAdding(false);
    }
  };

  if (added) {
    return (
      <span
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300`}
        title="Na biblioteca"
        aria-label="Já na biblioteca"
      >
        <Check className={icon} />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={adding}
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60`}
      title="Adicionar à biblioteca"
      aria-label="Adicionar à biblioteca"
    >
      {adding ? <Loader2 className={`${icon} animate-spin`} /> : <Plus className={icon} />}
    </button>
  );
}
