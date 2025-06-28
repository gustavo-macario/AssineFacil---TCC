import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [currency, setCurrencyState] = useState('BRL');

  useEffect(() => {
    if (session) {
      fetchCurrency();
    }
  }, [session]);

  const fetchCurrency = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('currency')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      if (data?.currency) {
        setCurrencyState(data.currency);
      }
    } catch (error) {
      console.error('Erro ao buscar moeda:', error);
    }
  };

  const setCurrency = async (newCurrency: string) => {
    try {
      await supabase
        .from('user_settings')
        .update({ currency: newCurrency })
        .eq('id', session?.user.id);
      
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Erro ao atualizar moeda:', error);
      throw error;
    }
  };

  const getCurrencySymbol = (currencyCode: string) => {
    const symbols: { [key: string]: string } = {
      'BRL': 'R$',
      'USD': '$',
      'EUR': '€',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'Fr'
    };
    return symbols[currencyCode] || currencyCode;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currencySymbol: getCurrencySymbol(currency)
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency deve ser usado dentro de um CurrencyProvider');
  }
  return context;
} 