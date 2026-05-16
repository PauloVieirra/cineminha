import { Film } from "lucide-react";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 text-slate-950">
        <Film className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          CINEMINHA
        </h1>
        {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
      </div>
    </div>
  );
}
