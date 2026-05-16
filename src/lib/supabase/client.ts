import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export const supabase: SupabaseClient = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: "cineminha-supabase-auth",
    },
  }
);

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    const hint = import.meta.env.PROD
      ? "No painel da Vercel (ou do host): Settings → Environment Variables — adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e faça um novo deploy."
      : "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env na raiz do projeto e reinicie o npm run dev.";
    throw new Error(`Supabase não configurado. ${hint}`);
  }
}
