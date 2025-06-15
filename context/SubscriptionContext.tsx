import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { Subscription } from '@/types';

// Define as categorias padrão aqui para serem acessíveis
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
  customCategories: string[]; // Novo estado para categorias personalizadas
  allCategories: string[]; // Combinação de default e custom
  refreshSubscriptions: () => Promise<void>;
  addSubscription: (subscription: Omit<Subscription, 'id' | 'user_id'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  addCustomCategory: (categoryName: string) => Promise<void>; // Nova função
  deleteCustomCategory: (categoryName: string) => Promise<void>; // Nova função
  // Não vamos expor updateSubscriptionsCategory diretamente no contexto por enquanto
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]); // Estado para categorias personalizadas

  // Simula o carregamento de categorias personalizadas (a ser substituído pela lógica do Supabase)
  const fetchCustomCategories = async () => {
    if (!session) return;
    // Por enquanto, vamos manter um array em memória.
    // Em uma implementação real, isso viria do Supabase ou AsyncStorage.
    // Exemplo: const { data, error } = await supabase.from('user_categories').select('category_name').eq('user_id', session.user.id);
    // if (data) setCustomCategories(data.map(c => c.category_name));
    console.log('Buscando categorias personalizadas (simulado)...');
    // Para teste, podemos adicionar algumas categorias personalizadas iniciais aqui se quisermos
    // setCustomCategories(['Trabalho', 'Estudos Pessoais']); 
  };
  
  const allCategories = React.useMemo(() => {
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories])).sort();
  }, [customCategories]);

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

  const addCustomCategory = async (categoryName: string) => {
    if (!session || !categoryName.trim()) return;
    const trimmedCategory = categoryName.trim();
    if (!customCategories.includes(trimmedCategory) && !DEFAULT_CATEGORIES.includes(trimmedCategory)) {
      // Lógica para adicionar ao Supabase viria aqui
      setCustomCategories(prev => [...prev, trimmedCategory].sort());
      console.log(`Categoria personalizada adicionada (simulado): ${trimmedCategory}`);
    } else {
      console.log(`Categoria já existe: ${trimmedCategory}`);
      // Poderia lançar um erro ou retornar um status
    }
  };

  const updateSubscriptionsCategory = async (oldCategoryName: string, newCategoryName: string | null) => {
    if (!session) return;
    const categoryToSet = newCategoryName === null || newCategoryName === undefined ? 'Outro' : newCategoryName;

    const subsToUpdate = subscriptions.filter(sub => sub.category === oldCategoryName);
    if (subsToUpdate.length === 0) return;

    console.log(`Atualizando categoria de "${oldCategoryName}" para "${categoryToSet}" para ${subsToUpdate.length} assinaturas.`);

    // Atualiza localmente primeiro
    const updatedSubs = subscriptions.map(sub => 
      sub.category === oldCategoryName ? { ...sub, category: categoryToSet, updated_at: new Date().toISOString() } : sub
    );
    setSubscriptions(updatedSubs);

    // Lógica para atualizar no Supabase
    // Isso pode ser uma única chamada de batch ou múltiplas chamadas.
    // Exemplo com múltiplas chamadas:
    try {
      for (const sub of subsToUpdate) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ category: categoryToSet, updated_at: new Date().toISOString() })
          .eq('id', sub.id)
          .eq('user_id', session.user.id); // Segurança extra
        if (error) {
          console.error(`Falha ao atualizar categoria para assinatura ${sub.id}:`, error);
          // Reverter alterações locais ou lidar com o erro
          // Por simplicidade, vamos recarregar as assinaturas para garantir consistência
          await fetchSubscriptions(); 
          throw new Error(`Failed to update category for subscription ${sub.id}`);
        }
      }
      console.log(`Categoria atualizada com sucesso para ${subsToUpdate.length} assinaturas no Supabase.`);
    } catch (error) {
      console.error('Erro durante atualização em lote de categorias no Supabase:', error);
      throw error;
    }
  };

  const deleteCustomCategory = async (categoryName: string) => {
    if (!session || !categoryName.trim()) return;
    if (DEFAULT_CATEGORIES.includes(categoryName)) {
      console.log('Não é possível deletar uma categoria padrão.');
      // Poderia lançar um erro ou retornar um status
      return;
    }

    // Lógica para remover do Supabase viria aqui
    setCustomCategories(prev => prev.filter(cat => cat !== categoryName));
    console.log(`Categoria personalizada deletada (simulado): ${categoryName}`);

    // Atualiza as assinaturas que usavam esta categoria para 'Outro' (ou null/padrão)
    await updateSubscriptionsCategory(categoryName, 'Outro'); 
  };

  useEffect(() => {
    if (session) {
      fetchSubscriptions();
      fetchCustomCategories(); // Carrega categorias personalizadas
    } else {
      // Limpa os estados se não houver sessão
      setSubscriptions([]);
      setCustomCategories([]);
    }
  }, [session]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        subscriptions, 
        customCategories, // Expor categorias personalizadas
        allCategories, // Expor todas as categorias combinadas
        refreshSubscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        addCustomCategory, // Expor nova função
        deleteCustomCategory // Expor nova função
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