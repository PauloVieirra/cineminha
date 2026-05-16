import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { setManagerSession } from "../lib/auth";
import { registerManager } from "../services/manager";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ageConfirmed) {
      setError("Confirme que você tem 16 anos ou mais para criar a conta.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const manager = await registerManager(email, password, name);
      setManagerSession(manager.id);
      navigate("/perfis", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-8 inline-block text-sm text-slate-400 hover:text-white">
          ← Voltar ao início
        </Link>
        <Logo subtitle="Criar conta de gestor" />
        <p className="mt-6 text-slate-400">
          Cadastro com Supabase Auth. Sua conta é privada: perfis e vídeos ficam só no seu
          login.
        </p>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <strong className="text-amber-200">Atenção:</strong> somente pessoas com{" "}
          <strong>16 anos ou mais</strong> podem criar conta de gestor (responsável legal).
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Input
            label="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirmar senha"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">
              Confirmo que tenho 16 anos ou mais e sou responsável por criar e gerenciar
              perfis infantis nesta conta.
            </span>
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" fullWidth loading={loading} disabled={!ageConfirmed}>
            Criar conta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link to="/entrar" className="text-emerald-400 hover:text-emerald-300">
            Entrar
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
