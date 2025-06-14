-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "admin_access" ON profiles;
DROP POLICY IF EXISTS "user_access" ON profiles;
DROP POLICY IF EXISTS "Admin has full access" ON profiles;
DROP POLICY IF EXISTS "Users can access their own profile" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar uma política simples para admin
CREATE POLICY "admin_policy"
ON profiles
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Criar uma política simples para usuários
CREATE POLICY "user_policy"
ON profiles
FOR ALL
USING (
  auth.uid() = id
); 