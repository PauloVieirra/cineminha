import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/Logo";
import { PageShell } from "../components/PageShell";
import { setManagerSession } from "../lib/auth";
import { registerManager } from "../services/manager";

export function Setup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      navigate("/gestor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-md">
        <Logo subtitle="Configuração inicial" />
        <p className="mt-6 text-slate-400">
          Crie a conta do gestor. Somente você poderá adicionar perfis de crianças e vídeos.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Input label="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required />
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
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" fullWidth loading={loading}>
            Criar conta de gestor
          </Button>
        </form>
      </div>
    </PageShell>
  );
}
