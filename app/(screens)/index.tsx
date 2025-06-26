import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useExpenses } from '@/context/ExpensesContext';
import { useCurrency } from '@/context/CurrencyContext';
import { format, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, getDaysInMonth, isLeapYear, addMonths, addWeeks, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, TrendingUp, Calendar, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Subscription } from '@/types';
import { useNextBillingDate } from '@/hooks/useNextBillingDate';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { subscriptions } = useSubscriptions();
  const { monthlyCost, yearlyCost } = useExpenses();
  const { currencySymbol } = useCurrency();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Os dados são carregados automaticamente pelos contextos
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizePeriod = (period: string) => {
    if (!period) return '';
    const norm = period.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    switch (norm) {
      case 'diario':
      case 'daily':
        return 'diario';
      case 'semanal':
      case 'weekly':
        return 'semanal';
      case 'mensal':
      case 'monthly':
        return 'mensal';
      case 'trimestral':
      case 'quarterly':
        return 'trimestral';
      case 'anual':
      case 'yearly':
        return 'anual';
      default:
        return norm;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [session, subscriptions]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Componente para renderizar uma assinatura com cálculo de data
  const SubscriptionWithDate = ({ subscription }: { subscription: Subscription }) => {
    const { nextBillingDate, isLoading: isCalculatingDate } = useNextBillingDate(subscription);
    
    if (isCalculatingDate) {
      return null; // Não renderiza enquanto está calculando
    }
    
    if (!nextBillingDate) {
      return null; // Não renderiza se não conseguiu calcular a data
    }
    
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    
    // Para assinaturas diárias, mostra as próximas 30 cobranças
    if (subscription.renewal_period.toLowerCase() === 'diario') {
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (nextBillingDate > thirtyDaysFromNow) {
        return null;
      }
    } else {
      // Para outras assinaturas, mostra as cobranças do próximo mês
      if (nextBillingDate > nextMonth) {
        return null;
      }
    }
    
    return (
      <SubscriptionCard
        subscription={subscription}
        onPress={() => router.push({
          pathname: '/(screens)/subscription-details/[id]',
          params: { id: subscription.id }
        })}
        currencySymbol={currencySymbol}
      />
    );
  };

  const nextMonthSubs = subscriptions.filter(sub => sub.active);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Olá, {session?.user?.user_metadata?.full_name || 'Usuário'}
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
          Monitore suas assinaturas de forma eficiente
        </Text>
      </View>

      {/* Cost Summary */}
      <LinearGradient
        colors={['#3b82f6', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.costSummary}
      >
        <View style={styles.costItem}>
          <Text style={styles.costLabel}>Mensal</Text>
          <Text style={styles.costValue}>{currencySymbol} {monthlyCost.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.costItem}>
          <Text style={styles.costLabel}>Anual</Text>
          <Text style={styles.costValue}>{currencySymbol} {yearlyCost.toFixed(2)}</Text>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(screens)/add-subscription')}
        >
          <Plus size={24} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Adicionar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(screens)/subscriptions')}
        >
          <CreditCard size={24} color="#8b5cf6" />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Ver Todas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(screens)/analytics')}
        >
          <TrendingUp size={24} color="#14b8a6" />
          <Text style={[styles.quickActionText, { color: colors.text }]}>Análises</Text>
        </TouchableOpacity>
      </View>

      {/* Próximos 30 Dias */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Próximos 30 Dias</Text>
          <CreditCard size={20} color={colors.primary} />
        </View>
        
        {nextMonthSubs.length > 0 ? (
          nextMonthSubs.map(subscription => (
            <SubscriptionWithDate key={subscription.id} subscription={subscription} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Nenhuma cobrança nos próximos 30 dias
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  subGreeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  costSummary: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  costItem: {
    flex: 1,
    alignItems: 'center',
  },
  costLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  costValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: 'white',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAction: {
    width: '31%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});