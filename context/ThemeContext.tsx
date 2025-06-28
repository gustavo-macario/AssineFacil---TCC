import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

type ThemeType = 'light' | 'dark';

export const lightColors = {
  primary: '#3b82f6',
  primaryLight: '#93c5fd',
  secondary: '#8b5cf6',
  accent: '#14b8a6',
  background: '#f9fafb',
  card: '#ffffff',
  cardHighlight: '#f3f4f6',
  text: '#1f2937',
  textSecondary: '#4b5563',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  errorLight: '#fee2e2',
};

export const darkColors = {
  primary: '#3b82f6',
  primaryLight: '#1e40af',
  secondary: '#8b5cf6',
  accent: '#14b8a6',
  background: '#111827',
  card: '#1f2937',
  cardHighlight: '#374151',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  border: '#374151',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  errorLight: '#7f1d1d',
};

type ThemeContextType = {
  theme: ThemeType;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme() as ThemeType;
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme || 'light');
  const { session } = useAuth();
  
  const colors = theme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    if (session) {
      loadUserThemePreference();
    }
  }, [session]);

  const loadUserThemePreference = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('id', session?.user.id)
        .single();
      
      if (!error && data && data.theme) {
        setTheme(data.theme as ThemeType);
      }
    } catch (error) {
      console.error('Erro ao carregar preferência de tema:', error);
    }
  };

  const saveThemePreference = async (newTheme: ThemeType) => {
    if (session) {
      try {
        await supabase
          .from('user_settings')
          .update({ theme: newTheme })
          .eq('id', session.user.id);
      } catch (error) {
        console.error('Erro ao salvar preferência de tema:', error);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}