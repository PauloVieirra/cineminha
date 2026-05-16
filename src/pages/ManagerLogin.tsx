import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { setManagerSession } from "../lib/auth";
import { loginManager } from "../services/manager";

export function ManagerLogin() {
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
      navigate("/gestor");
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
          ← Voltar ao hub
        </Link>
        <Logo subtitle="Área do gestor" />
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
      </div>
    </PageShell>
  );
}
