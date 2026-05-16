import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]",
  secondary: "glass text-white hover:bg-white/10 active:scale-[0.98]",
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white active:scale-[0.98]",
  danger: "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  children,
  loading,
  fullWidth,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
