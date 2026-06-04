import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useYoutubeAgent } from "../../hooks/useYoutubeAgent";
import { searchYouTubeVideos, type YouTubeSearchItem } from "../../lib/youtube-api";

interface ChildYoutubeSearchProps {
  onPlay: (item: YouTubeSearchItem) => void;
}

export function ChildYoutubeSearch({ onPlay }: ChildYoutubeSearchProps) {
  const { online, checking } = useYoutubeAgent();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 450);
  const [results, setResults] = useState<YouTubeSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!online || debounced.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    searchYouTubeVideos(debounced, 12)
      .then((items) => {
        if (!cancelled) setResults(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro na busca");
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, online]);

  if (checking) {
    return (
      <p className="text-sm text-slate-500">Verificando busca no YouTube…</p>
    );
  }

  if (!online) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Busca no YouTube indisponível. O gestor precisa manter o agente ativo (servidor Python).
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-white">Buscar no YouTube</h2>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar qualquer vídeo…"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
          aria-label="Buscar no YouTube"
        />
      </label>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando…
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {results.length > 0 ? (
        <div className="scrollbar-hide mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {results.map((item) => (
            <button
              key={item.videoId}
              type="button"
              onClick={() => onPlay(item)}
              className="w-44 shrink-0 snap-center overflow-hidden rounded-xl text-left transition hover:ring-2 hover:ring-emerald-400/50"
            >
              <div className="aspect-video bg-slate-800">
                <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="line-clamp-2 p-2 text-xs font-medium text-slate-200">{item.title}</p>
            </button>
          ))}
        </div>
      ) : null}

      {!loading && debounced.trim().length >= 2 && results.length === 0 && !error ? (
        <p className="mt-4 text-sm text-slate-500">Nenhum resultado.</p>
      ) : null}
    </section>
  );
}
