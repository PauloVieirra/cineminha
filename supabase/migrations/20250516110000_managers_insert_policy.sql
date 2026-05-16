-- Permite ao gestor criar o próprio perfil se o trigger auth não rodou
CREATE POLICY managers_insert_own ON public.managers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
