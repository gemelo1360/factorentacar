/*
  # Fix policy issues and add default admin user

  1. Changes
    - Check for existing policies before creating new ones
    - Add default admin user with proper checks
  2. Security
    - Ensure proper RLS policies for profiles table
*/

-- Check if policies exist before dropping them
DO $$
BEGIN
  -- Drop policies only if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Los administradores pueden ver todos los perfiles') THEN
    DROP POLICY "Los administradores pueden ver todos los perfiles" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Los usuarios pueden ver su propio perfil') THEN
    DROP POLICY "Los usuarios pueden ver su propio perfil" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Los administradores pueden actualizar todos los perfiles') THEN
    DROP POLICY "Los administradores pueden actualizar todos los perfiles" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Los usuarios pueden actualizar su propio perfil') THEN
    DROP POLICY "Los usuarios pueden actualizar su propio perfil" ON profiles;
  END IF;
  
  -- Check if new policies exist before creating them
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Usuarios pueden ver su propio perfil') THEN
    CREATE POLICY "Usuarios pueden ver su propio perfil"
      ON profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Administradores pueden ver todos los perfiles') THEN
    CREATE POLICY "Administradores pueden ver todos los perfiles"
      ON profiles
      FOR SELECT
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Usuarios pueden actualizar su propio perfil') THEN
    CREATE POLICY "Usuarios pueden actualizar su propio perfil"
      ON profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Administradores pueden actualizar todos los perfiles') THEN
    CREATE POLICY "Administradores pueden actualizar todos los perfiles"
      ON profiles
      FOR UPDATE
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      );
  END IF;
END $$;

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