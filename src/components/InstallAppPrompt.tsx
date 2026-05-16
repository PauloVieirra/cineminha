import { Download, Share, Smartphone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { usePwaInstall } from "../hooks/usePwaInstall";
import { Button } from "./ui/Button";

function PromptShell({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className={`mt-8 w-full max-w-md rounded-2xl p-5 text-left ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
          <Download className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-white">Instalar Cineminha</p>
          <p className="text-xs text-slate-400">Acesso rápido sem abrir o navegador</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function InstallAppPrompt() {
  const { showInstallOption, canPromptInstall, showIosHint, installing, install } =
    usePwaInstall();
  const [iosOpen, setIosOpen] = useState(false);

  if (!showInstallOption) return null;

  if (showIosHint) {
    return (
      <PromptShell className="border border-white/10 bg-black/30">
        <p className="mt-4 text-sm text-slate-400">
          No iPhone ou iPad, adicione o Cineminha à tela inicial para abrir como app.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => setIosOpen((v) => !v)}
        >
          <Smartphone className="h-4 w-4" />
          {iosOpen ? "Ocultar passos" : "Como instalar no iOS"}
        </Button>
        {iosOpen ? (
          <ol className="mt-4 space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              Toque em <strong className="text-white">Compartilhar</strong> na barra do Safari.
            </li>
            <li>
              Escolha <strong className="text-white">Adicionar à Tela de Início</strong>.
            </li>
            <li>
              Confirme em <strong className="text-white">Adicionar</strong>.
            </li>
          </ol>
        ) : null}
      </PromptShell>
    );
  }

  return (
    <PromptShell className="border border-emerald-500/25 bg-emerald-500/10">
      <p className="mt-4 text-sm text-slate-300">
        Instale na tela inicial para abrir em tela cheia, como um app nativo.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4 w-full border border-emerald-500/30"
        loading={installing}
        disabled={!canPromptInstall}
        onClick={() => void install()}
      >
        <Download className="h-4 w-4" />
        {canPromptInstall ? "Instalar app" : "Aguardando instalação…"}
      </Button>
    </PromptShell>
  );
}
