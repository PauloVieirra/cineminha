-- Perfil adulto: busca direta no YouTube e regras de reprodução ampliadas
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS is_adult BOOLEAN NOT NULL DEFAULT false;

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
    'isAdult', c.is_adult,
    'createdAt', (EXTRACT(EPOCH FROM c.created_at) * 1000)::BIGINT
  )
  INTO result
  FROM public.children c
  WHERE c.id = p_child_id;

  RETURN result;
END;
$$;
