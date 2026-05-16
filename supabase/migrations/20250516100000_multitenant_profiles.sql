-- Multitenant: perfis só para o gestor autenticado (remove listagem pública no hub)
DROP POLICY IF EXISTS children_anon_select ON public.children;
