import { Lock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { verifyManagerPassword } from "../../services/manager";

interface GestorPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GestorPasswordModal({ open, onClose, onSuccess }: GestorPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await verifyManagerPassword(password);
      if (!ok) {
        setError("Senha incorreta.");
        return;
      }
      setPassword("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gestor-password-title"
    >
      <div className="w-full max-w-md rounded-2xl glass p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2 id="gestor-password-title" className="text-lg font-semibold text-white">
                Área do gestor
              </h2>
              <p className="text-sm text-slate-400">
                Digite sua senha para gerenciar vídeos e perfis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Senha da conta"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            autoFocus
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth loading={loading}>
              Confirmar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
