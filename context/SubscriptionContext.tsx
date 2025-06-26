import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/types';

const DEFAULT_CATEGORIES = [
  'Entretenimento',
  'Streaming',
  'Música',
  'Jogos',
  'Produtividade',
  'Utilitários',
  'Compras',
  'Alimentação',
  'Saúde e Bem-Estar',
  'Finanças',
  'Educação',
  'Outro',
];

interface SubscriptionContextType {
  subscriptions: Subscription[];
  allCategories: string[]; 
  refreshSubscriptions: () => Promise<void>;
  addSubscription: (subscription: Omit<Subscription, 'id' | 'user_id'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const allCategories = DEFAULT_CATEGORIES;

  const fetchSubscriptions = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      throw error;
    }
  };

  const refreshSubscriptions = async () => {
    await fetchSubscriptions();
  };

  const addSubscription = async (subscription: Omit<Subscription, 'id' | 'user_id'>) => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscription,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSubscriptions(prev => [...prev, data]);
    } catch (error) {
      console.error('Erro ao adicionar assinatura:', error);
      throw error;
    }
  };

  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? data : sub)
      );
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw error;
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      
      await fetchSubscriptions();
    } catch (error) {
      console.error('Erro ao deletar assinatura:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (session) {
      fetchSubscriptions();
    } else {
      setSubscriptions([]);
    }
  }, [session]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscriptions, 
        allCategories, 
        refreshSubscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptions must be used within a SubscriptionProvider');
  }
  return context;
}