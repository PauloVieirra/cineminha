-- Cineminha: schema inicial + RLS
-- Projeto: cynepkzfcvfcfxjldocc

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

CREATE TABLE public.managers (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.managers (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  emoji TEXT NOT NULL,
  featured_video_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.youtube_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.managers (id) ON DELETE CASCADE,
  youtube_channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE (manager_id, youtube_channel_id)
);

CREATE TABLE public.channel_children (
  channel_id UUID NOT NULL REFERENCES public.youtube_channels (id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children (id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, child_id)
);

CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.managers (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  platform TEXT NOT NULL,
  embed_id TEXT,
  thumbnail TEXT,
  channel_id TEXT,
  channel_title TEXT,
  catalog_channel_id UUID REFERENCES public.youtube_channels (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.children
  ADD CONSTRAINT children_featured_video_id_fkey
  FOREIGN KEY (featured_video_id) REFERENCES public.videos (id) ON DELETE SET NULL;

CREATE TABLE public.video_children (
  video_id UUID NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children (id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, child_id)
);

CREATE TABLE public.watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children (id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos (id) ON DELETE CASCADE,
  video_title TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_children_manager ON public.children (manager_id);
CREATE INDEX idx_videos_manager ON public.videos (manager_id);
CREATE INDEX idx_videos_embed ON public.videos (manager_id, embed_id);
CREATE INDEX idx_videos_catalog ON public.videos (catalog_channel_id);
CREATE INDEX idx_watch_sessions_child ON public.watch_sessions (child_id, started_at DESC);
CREATE INDEX idx_channel_children_child ON public.channel_children (child_id);

-- ---------------------------------------------------------------------------
-- Perfil do gestor ao registrar (Supabase Auth)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.managers (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Gestor')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC: setup e leitura infantil (sem login da criança)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.app_is_configured()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.managers LIMIT 1);
$$;

CREATE OR REPLACE FUNCTION public.get_child_profile(p_child_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', c.id,
    'name', c.name,
    'avatarColor', c.avatar_color,
    'emoji', c.emoji,
    'featuredVideoId', c.featured_video_id,
    'createdAt', (EXTRACT(EPOCH FROM c.created_at) * 1000)::BIGINT
  )
  INTO result
  FROM public.children c
  WHERE c.id = p_child_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_child_videos(p_child_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT json_agg(row_to_json(t) ORDER BY t."createdAt" DESC)
      FROM (
        SELECT
          v.id,
          v.title,
          v.url,
          v.platform,
          v.embed_id AS "embedId",
          v.thumbnail,
          v.channel_id AS "channelId",
          v.channel_title AS "channelTitle",
          v.catalog_channel_id AS "catalogChannelId",
          (EXTRACT(EPOCH FROM v.created_at) * 1000)::BIGINT AS "createdAt",
          COALESCE(
            (SELECT json_agg(vc.child_id) FROM public.video_children vc WHERE vc.video_id = v.id),
            '[]'::json
          ) AS "childIds"
        FROM public.videos v
        INNER JOIN public.video_children vc ON vc.video_id = v.id
        WHERE vc.child_id = p_child_id
      ) t
    ),
    '[]'::json
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_child_channels(p_child_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT json_agg(row_to_json(t) ORDER BY t."createdAt" DESC)
      FROM (
        SELECT
          ch.id,
          ch.youtube_channel_id AS "youtubeChannelId",
          ch.title,
          ch.description,
          ch.thumbnail,
          ch.source_url AS "sourceUrl",
          (EXTRACT(EPOCH FROM ch.created_at) * 1000)::BIGINT AS "createdAt",
          CASE
            WHEN ch.last_synced_at IS NULL THEN NULL
            ELSE (EXTRACT(EPOCH FROM ch.last_synced_at) * 1000)::BIGINT
          END AS "lastSyncedAt",
          COALESCE(
            (SELECT json_agg(cc.child_id) FROM public.channel_children cc WHERE cc.channel_id = ch.id),
            '[]'::json
          ) AS "childIds"
        FROM public.youtube_channels ch
        INNER JOIN public.channel_children cc ON cc.channel_id = ch.id
        WHERE cc.child_id = p_child_id
      ) t
    ),
    '[]'::json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.app_is_configured() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_profile(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_videos(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_child_channels(UUID) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;

-- Gestor: próprio perfil
CREATE POLICY managers_select_own ON public.managers
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY managers_update_own ON public.managers
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Filhos
CREATE POLICY children_manager_all ON public.children
  FOR ALL TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

-- Canais
CREATE POLICY channels_manager_all ON public.youtube_channels
  FOR ALL TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY channel_children_manager ON public.channel_children
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.youtube_channels ch
      WHERE ch.id = channel_id AND ch.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.youtube_channels ch
      WHERE ch.id = channel_id AND ch.manager_id = auth.uid()
    )
  );

-- Vídeos
CREATE POLICY videos_manager_all ON public.videos
  FOR ALL TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY video_children_manager ON public.video_children
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.manager_id = auth.uid()
    )
  );

-- Histórico (gestor lê tudo dos seus filhos; criança grava via RPC abaixo)
CREATE POLICY watch_sessions_manager_select ON public.watch_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_id AND c.manager_id = auth.uid()
    )
  );

CREATE POLICY watch_sessions_insert_anon ON public.watch_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id)
    AND EXISTS (SELECT 1 FROM public.video_children vc WHERE vc.video_id = video_id AND vc.child_id = child_id)
  );

CREATE POLICY watch_sessions_update_anon ON public.watch_sessions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Hub: listar perfis infantis sem login do gestor (app familiar, um gestor)
CREATE POLICY children_anon_select ON public.children
  FOR SELECT TO anon
  USING (true);

CREATE POLICY channels_anon_select ON public.youtube_channels
  FOR SELECT TO anon
  USING (
    EXISTS (SELECT 1 FROM public.channel_children cc WHERE cc.channel_id = id)
  );

-- Leitura infantil: RPC security definer (sem policy extra em children/videos)
