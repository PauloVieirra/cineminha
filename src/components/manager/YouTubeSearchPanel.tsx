import { Loader2, RefreshCw, Search, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useYoutubeAgent } from "../../hooks/useYoutubeAgent";
import { searchYouTubeVideos, type YouTubeSearchItem } from "../../lib/youtube-api";

interface YouTubeSearchPanelProps {
  onSelect: (item: YouTubeSearchItem) => void;
}

export function YouTubeSearchPanel({ onSelect }: YouTubeSearchPanelProps) {
  const { online, checking, refresh } = useYoutubeAgent();
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

    searchYouTubeVideos(debounced, 10)
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
      <div className="flex items-center gap-2 rounded-xl glass p-4 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Conectando ao agente Python...
      </div>
    );
  }

  if (!online) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        <p className="font-medium">Agente Python offline</p>
        <p className="mt-2 text-amber-200/80">
          Em outro terminal, na pasta do projeto, execute:
        </p>
        <code className="mt-2 block rounded-lg bg-black/30 px-3 py-2 text-xs text-amber-100">
          npm run agent
        </code>
        <p className="mt-2 text-amber-200/70 text-xs">
          Ou use <code className="text-amber-100">npm run dev:all</code> para subir site + agente juntos.
          Você ainda pode colar links de canal ou vídeo manualmente.
        </p>
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          <RefreshCw className="h-3 w-3" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Buscar no YouTube <span className="text-emerald-500/80">(agente local)</span>
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o nome do vídeo ou canal..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-400" />
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {results.length > 0 ? (
        <ul className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
          {results.map((item) => (
            <li key={item.videoId}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full gap-3 rounded-xl p-2 text-left transition hover:bg-white/10"
              >
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <Youtube className="h-3 w-3 shrink-0" />
                    {item.channelTitle || "YouTube"}
                  </p>
                  </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {debounced.length >= 2 && !loading && !error && results.length === 0 ? (
        <p className="text-center text-sm text-slate-500">Nenhum resultado encontrado.</p>
      ) : null}
    </div>
  );
}
