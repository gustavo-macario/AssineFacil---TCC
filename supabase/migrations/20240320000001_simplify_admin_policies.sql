-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admin has full access" ON profiles;
DROP POLICY IF EXISTS "Users can access their own profile" ON profiles;

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar uma única política para admin
CREATE POLICY "admin_access"
ON profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Criar uma única política para usuários comuns
CREATE POLICY "user_access"
ON profiles
FOR ALL
USING (
  auth.uid() = id
); 