import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  credits: number;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshUser: (knownCredits?: number) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const loadAppUser = async (
  authUser: SupabaseUser,
  knownCredits?: number
): Promise<AppUser> => {
  let credits = knownCredits;
  let name = String(authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'Usuário');

  if (credits === undefined) {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, credits')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) throw new Error(`Não foi possível carregar seu perfil: ${error.message}`);
    if (data) {
      credits = Number(data.credits ?? 0);
      name = data.name || name;
    } else {
      credits = 0;
    }
  }

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name,
    credits,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (knownCredits?: number) => {
    if (!authUser) return;
    setUser(await loadAppUser(authUser, knownCredits));
  }, [authUser]);

  useEffect(() => {
    let active = true;

    const setSessionUser = async (nextAuthUser: SupabaseUser | null) => {
      if (!active) return;
      setAuthUser(nextAuthUser);
      if (!nextAuthUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const appUser = await loadAppUser(nextAuthUser);
        if (active) setUser(appUser);
      } catch (error) {
        console.error('Falha ao carregar perfil autenticado:', error);
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => setSessionUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void setSessionUser(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Não foi possível iniciar sua sessão.');
    setAuthUser(data.user);
    setUser(await loadAppUser(data.user));
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Não foi possível criar sua conta.');

    const requiresEmailConfirmation = !data.session;
    if (data.session) {
      setAuthUser(data.user);
      setUser(await loadAppUser(data.user));
    }
    return { requiresEmailConfirmation };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setAuthUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
