import { Loader2 } from "lucide-react";

interface ImportProgressBannerProps {
  current: number;
  total: number;
  title?: string;
  label?: string;
}

export function ImportProgressBanner({
  current,
  total,
  title,
  label = "Adicionando à biblioteca",
}: ImportProgressBannerProps) {
  const isPrep = total === 1 && current === 0 && title?.includes("…");
  const pct = total > 0 && !isPrep ? Math.round((current / total) * 100) : isPrep ? 15 : 0;

  return (
    <div
      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-100">
            {isPrep ? (
              title
            ) : (
              <>
                {label} — <strong>{current}</strong> de <strong>{total}</strong>
              </>
            )}
          </p>
          {!isPrep && title ? (
            <p className="mt-1 truncate text-xs text-emerald-200/80">{title}</p>
          ) : !isPrep ? (
            <p className="mt-1 text-xs text-emerald-200/70">Aguarde, isso pode levar um minuto…</p>
          ) : null}
        </div>
        <span className="text-sm font-semibold tabular-nums text-emerald-300">{pct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
