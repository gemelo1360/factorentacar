/*
  # Fix infinite recursion in policies

  1. Changes
    - Replace recursive policies with non-recursive alternatives
    - Add public access policy for profiles table
    - Fix policy conditions to avoid infinite recursion
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

-- Create new non-recursive policies
-- Allow public access to profiles (needed for authentication)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON profiles FOR DELETE 
USING (auth.uid() = id);

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