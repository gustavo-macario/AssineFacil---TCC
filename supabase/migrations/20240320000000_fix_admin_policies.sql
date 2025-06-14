-- Remover as políticas antigas
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Criar uma única política para permitir acesso total ao admin
CREATE POLICY "Admin has full access"
  ON profiles
  FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Criar política para usuários comuns
CREATE POLICY "Users can access their own profile"
  ON profiles
  FOR ALL
  USING (
    auth.uid() = id
  ); 