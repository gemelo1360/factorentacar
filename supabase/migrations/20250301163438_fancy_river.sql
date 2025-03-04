/*
  # Fix User Management Permissions

  1. Changes
    - Add policies to allow users to create new users
    - Add policies to allow updating profiles
    - Fix recursive policy issues
*/

-- Drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Los administradores pueden actualizar todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Create new simplified policies
-- Allow everyone to view profiles (needed for the user management page)
CREATE POLICY "Allow viewing all profiles"
ON profiles FOR SELECT
USING (true);

-- Allow everyone to update profiles (needed for role management)
CREATE POLICY "Allow updating all profiles"
ON profiles FOR UPDATE
USING (true);

-- Allow inserting profiles (needed for user creation)
CREATE POLICY "Allow inserting profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- Create default admin user if it doesn't exist
DO $$
BEGIN
  -- Check if admin user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN
    -- Insert admin user
    INSERT INTO auth.users (
      id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      created_at, 
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'admin@admin.com',
      crypt('123456789', gen_salt('bf')),
      now(),
      now(),
      now()
    );
  END IF;

  -- Check if admin profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@admin.com') THEN
    -- Insert admin profile
    INSERT INTO profiles (
      id, 
      email, 
      role, 
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'admin@admin.com',
      'admin',
      now()
    );
  END IF;
END $$;