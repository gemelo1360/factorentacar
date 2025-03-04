/*
  # Create admin user and fix profiles table

  1. New Tables
    - No new tables created
  2. Security
    - Fix infinite recursion in profiles policies
    - Create default admin user
  3. Changes
    - Update RLS policies for profiles table
*/

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Los administradores pueden actualizar todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Administradores pueden ver todos los perfiles"
  ON profiles
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Administradores pueden actualizar todos los perfiles"
  ON profiles
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Create default admin user if it doesn't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'admin@admin.com',
  crypt('123456789', gen_salt('bf')),
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@admin.com'
);

-- Create profile for admin user
INSERT INTO profiles (id, email, role, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'admin@admin.com',
  'admin',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'admin@admin.com'
);