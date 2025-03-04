import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContextType, User } from '../types';
import { PRODUCTION_MODE } from '../config';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Crear un usuario básico con la información disponible
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin' // Por defecto, todos son admin para simplificar
          });
        } else if (!PRODUCTION_MODE) {
          // En modo desarrollo, crear un usuario temporal
          setUser({
            id: '00000000-0000-0000-0000-000000000000',
            email: 'usuario.temporal@factorentacar.com',
            role: 'admin'
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: 'admin' // Por defecto, todos son admin para simplificar
        });
      } else if (!PRODUCTION_MODE) {
        // En modo desarrollo, mantener el usuario temporal
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'usuario.temporal@factorentacar.com',
          role: 'admin'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      
      // En modo desarrollo, restaurar el usuario temporal después de cerrar sesión
      if (!PRODUCTION_MODE) {
        setUser({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'usuario.temporal@factorentacar.com',
          role: 'admin'
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}