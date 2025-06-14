-- Remove TODAS as políticas existentes
DROP POLICY IF EXISTS "user_own_profile" ON "public"."profiles";
DROP POLICY IF EXISTS "user_own_subscriptions" ON "public"."subscriptions";
DROP POLICY IF EXISTS "users_can_view_own_profile" ON "public"."profiles";
DROP POLICY IF EXISTS "users_can_view_own_subscriptions" ON "public"."subscriptions";

-- Recria apenas as políticas básicas
CREATE POLICY "user_own_profile"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "user_own_subscriptions"
ON "public"."subscriptions"
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Cria função para verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Remove políticas existentes de admin (se existirem)
DROP POLICY IF EXISTS "admin_view_all_profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "admin_view_all_subscriptions" ON "public"."subscriptions";

-- Adiciona política para admins verem todos os perfis
CREATE POLICY "admin_view_all_profiles"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (is_admin());

-- Adiciona política para admins verem todas as assinaturas
CREATE POLICY "admin_view_all_subscriptions"
ON "public"."subscriptions"
FOR SELECT
TO authenticated
USING (is_admin()); 