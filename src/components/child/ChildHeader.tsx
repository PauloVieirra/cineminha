import { Home, Search, X } from "lucide-react";
import type { ChildProfile } from "../../types";

interface ChildHeaderProps {
  child: ChildProfile;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onHome: () => void;
}

export function ChildHeader({ child, searchQuery, onSearchChange, onHome }: ChildHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0e17]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
            style={{
              background: `linear-gradient(135deg, ${child.avatarColor}99, ${child.avatarColor})`,
            }}
          >
            {child.emoji}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-widest text-emerald-400/90">
              Cineminha
            </p>
            <p className="truncate text-sm font-bold text-white sm:text-base">{child.name}</p>
          </div>
        </div>

        <label className="relative order-3 w-full sm:order-none sm:ml-auto sm:w-64 md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              child.isAdult ? "Buscar na biblioteca…" : "Buscar na sua biblioteca..."
            }
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
            aria-label="Buscar vídeos"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-white"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <button
          type="button"
          onClick={onHome}
          className="order-2 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass text-slate-300 transition hover:text-white sm:order-none sm:ml-0"
          aria-label="Trocar perfil"
        >
          <Home className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
