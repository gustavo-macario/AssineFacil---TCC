-- Primeiro, vamos desabilitar o RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "admin_policy" ON profiles;
DROP POLICY IF EXISTS "user_policy" ON profiles;
DROP POLICY IF EXISTS "admin_access" ON profiles;
DROP POLICY IF EXISTS "user_access" ON profiles;
DROP POLICY IF EXISTS "Admin has full access" ON profiles;
DROP POLICY IF EXISTS "Users can access their own profile" ON profiles;

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar uma política para permitir acesso total ao admin
CREATE POLICY "admin_full_access"
ON profiles
FOR ALL
USING (
  auth.uid() = id AND role = 'admin'
);

-- Criar uma política para usuários comuns
CREATE POLICY "user_own_profile"
ON profiles
FOR ALL
USING (
  auth.uid() = id
); 