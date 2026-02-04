import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeAuthError = (error) => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return new Error(
        'Sunucuya bağlanılamadı. Supabase URL/anahtar ve ağ bağlantısını kontrol edin.'
      );
    }

    return error;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        })();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: userId,
              display_name: 'Kullanıcı',
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, displayName) => {
    const normalizedEmail = email?.trim();
    const normalizedPassword = password?.trim();
    const normalizedDisplayName = displayName?.trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('E-posta ve şifre alanları zorunludur.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('E-posta ve şifre alanları zorunludur.');
    }

    let data;
    try {
      const response = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      data = response.data;

      if (response.error) throw response.error;
    } catch (error) {
      throw normalizeAuthError(error);
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          user_id: data.user.id,
          display_name: normalizedDisplayName || 'Kullanıcı',
        },
        {
          onConflict: 'user_id',
        }
      );

      if (profileError) {
        throw profileError;
      }
    }

    if (signUpData?.user) {
      try {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            user_id: signUpData.user.id,
            display_name: normalizedDisplayName || 'Kullanıcı',
          },
          {
            onConflict: 'user_id',
          }
        );

        if (profileError) {
          throw profileError;
        }
      } catch (error) {
        throw normalizeAuthError(error);
      }
    }

    return signUpData;
  };

  const signIn = async (email, password) => {
    const normalizedEmail = email?.trim();
    const normalizedPassword = password?.trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('E-posta ve şifre alanları zorunludur.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('E-posta ve şifre alanları zorunludur.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw normalizeAuthError(error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
