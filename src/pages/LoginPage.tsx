import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { setManagerSession } from "../lib/auth";
import { loginManager } from "../services/manager";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const manager = await loginManager(email, password);
      setManagerSession(manager.id);
      navigate("/perfis", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
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
        <Logo subtitle="Entrar na sua conta" />
        <p className="mt-6 text-slate-400">
          Use o e-mail e a senha cadastrados. Você verá apenas os perfis da sua família.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
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
            autoComplete="current-password"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" fullWidth loading={loading}>
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-emerald-400 hover:text-emerald-300">
            Criar conta de gestor
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
