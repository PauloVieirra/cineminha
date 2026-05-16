# Supabase — Cineminha

Projeto: **cynepkzfcvfcfxjldocc**

## 1. Aplicar o schema

No [Dashboard Supabase](https://supabase.com/dashboard/project/cynepkzfcvfcfxjldocc/sql) → **SQL Editor**, execute o arquivo:

`supabase/migrations/20250516000000_initial_schema.sql`

Ou use o MCP do Supabase no Cursor (`.cursor/mcp.json`).

## 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://cynepkzfcvfcfxjldocc.supabase.co
VITE_SUPABASE_ANON_KEY=<sua chave anon em Settings → API>
VITE_YOUTUBE_AGENT_URL=http://127.0.0.1:8765
```

## 3. Auth (gestor)

- Cadastro em `/configurar` usa **Supabase Auth** (`signUp`)
- Login em `/gestor/login` usa `signInWithPassword`
- Trigger `on_auth_user_created` cria a linha em `managers`

## 4. MCP no Cursor

O arquivo `.cursor/mcp.json` já aponta para:

`https://mcp.supabase.com/mcp?project_ref=cynepkzfcvfcfxjldocc`

Reinicie o Cursor e autentique no MCP Supabase quando solicitado.

## 5. Migração do IndexedDB

Os dados antigos no navegador **não** migram automaticamente. Após o schema:

1. Crie o gestor em `/configurar`
2. Recrie perfis infantis e importe canais/vídeos
