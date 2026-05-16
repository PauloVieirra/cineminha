import { motion } from "framer-motion";
import { Film, Shield, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { InstallAppPrompt } from "../components/InstallAppPrompt";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

const features = [
  {
    icon: Shield,
    title: "Ambiente seguro",
    description:
      "Só entra na biblioteca o que o responsável aprovar. Sem busca aberta na internet.",
  },
  {
    icon: Users,
    title: "Perfis por criança",
    description:
      "Cada filho tem avatar, biblioteca e histórico separados — tudo ligado à sua conta de gestor.",
  },
  {
    icon: Sparkles,
    title: "Canais e vídeos curados",
    description:
      "Importe canais do YouTube em lote ou escolha vídeo a vídeo o que pode assistir.",
  },
];

export function LandingPage() {
  const { ready, isAuthenticated } = useAuth();

  return (
    <div className="gradient-mesh min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <div className="flex gap-2 sm:gap-3">
          <Link
            to="/entrar"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Entrar
          </Link>
          <Link to="/cadastro">
            <Button className="text-sm">Criar conta de gestor</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="py-12 text-center sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
              <Film className="h-3.5 w-3.5" />
              Plataforma familiar de vídeos
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Cinema em casa,
              <span className="block bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                com tranquilidade
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              O <strong className="text-slate-200">Cineminha</strong> é um cinema digital
              pensado para famílias: pais e responsáveis montam uma biblioteca segura; as
              crianças assistem só ao que foi liberado — com visual moderno e fácil de usar.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {ready && isAuthenticated ? (
              <Link to="/perfis">
                <Button className="min-w-[220px] px-8 py-3.5 text-base">
                  Continuar para os perfis
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/cadastro">
                  <Button className="min-w-[220px] px-8 py-3.5 text-base">
                    Criar conta de gestor
                  </Button>
                </Link>
                <Link to="/entrar">
                  <Button variant="secondary" className="min-w-[220px] px-8 py-3.5 text-base">
                    Já tenho conta — entrar
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <div className="flex justify-center">
            <InstallAppPrompt />
          </div>

          <p className="mx-auto mt-6 max-w-lg text-xs text-amber-200/90">
            Apenas maiores de 16 anos podem criar conta de gestor. O cadastro é feito com
            e-mail e senha (Supabase Auth) e cada família vê somente os próprios perfis.
          </p>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-2xl glass p-6"
            >
              <f.icon className="h-8 w-8 text-emerald-400" />
              <h2 className="mt-4 text-lg font-semibold text-white">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-white/10 bg-black/25 p-8 sm:p-10">
          <h2 className="text-xl font-bold text-white">Para que serve?</h2>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Foi criado para substituir a navegação livre no YouTube na infância: em vez de
            algoritmos e anúncios imprevisíveis, a criança escolhe entre perfis e vídeos que
            você cadastrou. O gestor organiza canais, importa até 30 vídeos por vez, define
            destaques e acompanha o que foi assistido — tudo em um painel só seu (multicontas:
            cada login vê apenas os próprios dados).
          </p>
        </section>
      </main>
    </div>
  );
}
