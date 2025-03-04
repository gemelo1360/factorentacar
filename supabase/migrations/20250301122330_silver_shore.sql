/*
  # Configuración inicial de autenticación y perfiles

  1. Nueva Tabla
    - `profiles`
      - `id` (uuid, primary key) - Vinculado al id de usuario de auth
      - `email` (text, not null) - Email del usuario
      - `role` (text, not null) - Rol del usuario (admin/operador)
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad
    - Habilitar RLS en la tabla `profiles`
    - Políticas para permitir a los administradores gestionar todos los perfiles
    - Políticas para permitir a los usuarios ver su propio perfil
*/

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operador' CHECK (role IN ('admin', 'operador')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Los administradores pueden ver todos los perfiles"
  ON profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden actualizar todos los perfiles"
  ON profiles
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Función para crear automáticamente un perfil cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'operador');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función cuando se crea un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar usuario administrador inicial
DO $$
BEGIN
  -- Verificar si el usuario ya existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'ronaldrojascastro@gmail.com'
  ) THEN
    -- Crear usuario administrador (esto solo funcionará si se ejecuta desde la consola de Supabase)
    -- En la aplicación real, se debe crear el usuario a través de la API de Supabase
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'ronaldrojascastro@gmail.com',
      crypt('Gordis23+', gen_salt('bf')),
      now(),
      now(),
      now()
    );
    
    -- Actualizar el rol a administrador
    UPDATE profiles
    SET role = 'admin'
    WHERE email = 'ronaldrojascastro@gmail.com';
  END IF;
END $$;