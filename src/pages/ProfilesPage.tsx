import { motion } from "framer-motion";
import { LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GestorPasswordModal } from "../components/manager/GestorPasswordModal";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { Button } from "../components/ui/Button";
import { useAsyncData } from "../hooks/useAsyncData";
import { setActiveChild, clearAllSessions } from "../lib/auth";
import { setGestorUnlocked } from "../lib/gestor-access";
import { listChildren } from "../services/children";
import { logoutManager } from "../services/manager";

export function ProfilesPage() {
  const navigate = useNavigate();
  const [gestorModalOpen, setGestorModalOpen] = useState(false);

  const { data: children, loading, error } = useAsyncData(() => listChildren(), []);

  const selectChild = (id: string) => {
    setActiveChild(id);
    navigate(`/assistir/${id}`);
  };

  const openGestor = () => {
    setGestorModalOpen(true);
  };

  const onGestorUnlocked = () => {
    setGestorUnlocked();
    setGestorModalOpen(false);
    navigate("/gestor");
  };

  const handleLogout = async () => {
    await logoutManager();
    clearAllSessions();
    navigate("/", { replace: true });
  };

  return (
    <PageShell>
      <header className="mb-10 flex items-center justify-between gap-4">
        <Logo subtitle="Quem está assistindo?" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openGestor}
            className="flex h-11 w-11 items-center justify-center rounded-full glass text-slate-300 transition hover:text-emerald-400"
            title="Gerenciar vídeos e perfis (senha)"
            aria-label="Área do gestor"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-full glass text-slate-400 transition hover:text-red-400"
            title="Sair da conta"
            aria-label="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {error ? (
        <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col items-center py-8 sm:py-16">
        {loading ? (
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        ) : !children?.length ? (
          <div className="max-w-md text-center">
            <p className="text-6xl mb-6">👋</p>
            <h2 className="text-2xl font-bold text-white">Crie o primeiro perfil</h2>
            <p className="mt-3 text-slate-400">
              Ainda não há perfis infantis nesta conta. Abra a área do gestor (ícone de engrenagem)
              e cadastre o primeiro perfil com nome, emoji e cor.
            </p>
            <Button className="mt-8" onClick={openGestor}>
              Abrir gestão — criar perfil
            </Button>
          </div>
        ) : (
          <div className="grid w-full max-w-2xl grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10">
            {children.map((child, i) => (
              <motion.button
                key={child.id}
                type="button"
                onClick={() => selectChild(child.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
              >
                <ProfileAvatar
                  name={child.name}
                  emoji={child.emoji}
                  color={child.avatarColor}
                  size="xl"
                />
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <GestorPasswordModal
        open={gestorModalOpen}
        onClose={() => setGestorModalOpen(false)}
        onSuccess={onGestorUnlocked}
      />
    </PageShell>
  );
}
