import { assertSupabaseConfigured, supabase } from "../lib/supabase/client";
import { mapManager, type ManagerRow } from "../lib/supabase/mappers";
import type { Manager } from "../types";

export async function hasManager(): Promise<boolean> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.rpc("app_is_configured");
  if (error) {
    console.warn("app_is_configured:", error.message);
    return false;
  }
  return Boolean(data);
}

async function fetchManagerRow(userId: string): Promise<ManagerRow | null> {
  const { data, error } = await supabase
    .from("managers")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ManagerRow | null;
}

/** Garante linha em `managers` (trigger pode não ter rodado ou migration pendente). */
async function ensureManagerProfile(
  userId: string,
  email: string,
  name: string
): Promise<Manager> {
  const existing = await fetchManagerRow(userId);
  if (existing) return mapManager(existing);

  const { data: inserted, error } = await supabase
    .from("managers")
    .insert({
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim() || "Gestor",
    })
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      const row = await fetchManagerRow(userId);
      if (row) return mapManager(row);
    }
    throw new Error(
      error.message.includes("row-level security")
        ? "Perfil de gestor não criado. No Supabase, aplique as migrations SQL do projeto."
        : error.message
    );
  }

  if (inserted) return mapManager(inserted as ManagerRow);

  const row = await fetchManagerRow(userId);
  if (row) return mapManager(row);

  return {
    id: userId,
    email,
    name: name.trim() || "Gestor",
    createdAt: Date.now(),
  };
}

export async function registerManager(
  email: string,
  password: string,
  name: string
): Promise<Manager> {
  assertSupabaseConfigured();

  const normalizedEmail = email.toLowerCase().trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: name.trim() },
    },
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Não foi possível criar a conta.");

  if (!authData.session) {
    throw new Error(
      "Conta criada. Confirme seu e-mail pelo link enviado (verifique spam) e depois use Entrar."
    );
  }

  return ensureManagerProfile(authData.user.id, authData.user.email ?? normalizedEmail, name);
}

export async function loginManager(email: string, password: string): Promise<Manager> {
  assertSupabaseConfigured();

  const normalizedEmail = email.toLowerCase().trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
      throw new Error("Confirme seu e-mail antes de entrar (verifique a caixa de entrada).");
    }
    throw new Error("E-mail ou senha incorretos.");
  }

  const displayName =
    (data.user.user_metadata?.name as string | undefined) ?? "Gestor";

  return ensureManagerProfile(data.user.id, data.user.email ?? normalizedEmail, displayName);
}

export async function logoutManager(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getManagerById(id: string): Promise<Manager | undefined> {
  assertSupabaseConfigured();
  const row = await fetchManagerRow(id);
  return row ? mapManager(row) : undefined;
}

/** Revalida a senha do gestor já autenticado (área de gestão). */
export async function verifyManagerPassword(password: string): Promise<boolean> {
  assertSupabaseConfigured();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email) return false;

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  return !error;
}
