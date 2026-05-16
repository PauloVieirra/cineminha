# Cineminha

Plataforma de vídeos seguros para crianças, com área de gestão para adultos.

## Funcionalidades

- **Hub de perfis** — seleção estilo streaming para cada criança
- **Gestor** — login, criação de perfis infantis, publicação de links (YouTube, Vimeo, .mp4)
- **Visualização segura** — player em modo restrito (sem busca, sem links externos na interface infantil)
- **Histórico completo** — o gestor acompanha o que cada perfil assistiu
- **Banco local** — IndexedDB via Dexie (pronto para migrar para backend depois)

## Agente YouTube (Python + yt-dlp)

**Não usa API oficial do Google.** Um servidor Python local lê canais e vídeos com [yt-dlp](https://github.com/yt-dlp/yt-dlp).

### Instalar dependências Python (uma vez)

```bash
pip install -r server/requirements.txt
```

### Rodar o projeto

**Opção A — site + agente juntos:**

```bash
npm install
npm run dev:all
```

**Opção B — terminais separados:**

```bash
npm run agent    # terminal 1 — agente em http://127.0.0.1:8765
npm run dev      # terminal 2 — site em http://localhost:5173
```

### O que o agente faz

- Entende links de canal (`@handle`, `/channel/UC...`, `/c/nome`)
- Importa até 30 vídeos do canal para a biblioteca
- Busca vídeos por texto no painel do gestor
- Alimenta a faixa **“Mais do canal”** na visualização da criança

## Como rodar (só o site)

```bash
npm install
npm run dev
```

Sem o agente, links manuais de vídeo ainda funcionam; busca e importação de canal precisam do Python.

## Rotas

| Rota | Uso |
|------|-----|
| `/` | Hub — crianças escolhem o perfil (sempre abre aqui) |
| `/assistir/:childId` | Biblioteca do perfil |
| `/configurar` | Criar conta do gestor (só na 1ª vez) |
| `/gestor/login` | Login do gestor |
| `/gestor` | Painel do gestor |
| `/gestor/canal/:id` | Detalhe do canal importado |
| `/assistir/:childId/canal/:id` | Canal na visão da criança |

## Primeiro uso

1. Abra `/` e acesse o ícone de gestor → em **Configurar**, crie a conta do gestor
2. Em **Gestor → Perfis**, cadastre os filhos
3. Em **Gestor → Vídeos**, cole os links aprovados
4. No **Hub**, a criança escolhe o perfil e assiste

## Segurança do player

- YouTube via `youtube-nocookie.com` com parâmetros que limitam recomendações e branding
- Vimeo sem título/autor no embed
- Arquivos `.mp4` com controles nativos restritos
- Interface infantil sem barra de pesquisa ou navegação externa

> **Nota:** embeds de terceiros não eliminam 100% dos riscos de plataformas como YouTube. Para máxima segurança, prefira vídeos hospedados diretamente (.mp4) ou use um backend com proxy de mídia no futuro.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- Dexie (IndexedDB)
- Framer Motion
- Python FastAPI + yt-dlp (agente local)
