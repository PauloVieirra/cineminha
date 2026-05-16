import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`
          w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white
          placeholder:text-slate-500 outline-none transition
          focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
          ${error ? "border-red-500/50" : ""} ${className}
        `}
        {...props}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
