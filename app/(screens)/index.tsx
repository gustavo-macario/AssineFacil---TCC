import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useExpenses } from '@/context/ExpensesContext';
import { format, addDays, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, getDaysInMonth, isLeapYear, addMonths, addWeeks, addYears } from 'date-fns';
import { CreditCard, TrendingUp, Calendar, Plus } from 'lucide-react-native';
import SubscriptionCard from '@/components/SubscriptionCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Subscription } from '@/types';
import { ptBR } from 'date-fns/locale';

export default function HomeScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { currencySymbol } = useCurrency();
  const { subscriptions } = useSubscriptions();
  const { monthlyCost, yearlyCost } = useExpenses();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!session) return;

    try {
      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Erro ao processar assinaturas:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const normalizePeriod = (period: string) => {
    if (!period) return '';
    // Remove acentos e deixa minúsculo
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

  const getNextBillingDate = (sub: Subscription): Date => {
    const billingDate = new Date(sub.billing_date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Se a data de cobrança já passou, calcula a próxima
    if (billingDate < today) {
      switch (sub.renewal_period.toLowerCase()) {
        case 'diario':
          // Para assinaturas diárias, calcula quantos dias se passaram desde a última cobrança
          const daysDiff = Math.ceil((today.getTime() - billingDate.getTime()) / (1000 * 60 * 60 * 24));
          return addDays(billingDate, daysDiff);
        case 'semanal':
          return addWeeks(billingDate, 1);
        case 'mensal':
          return addMonths(billingDate, 1);
        case 'trimestral':
          return addMonths(billingDate, 3);
        case 'anual':
          return addYears(billingDate, 1);
        default:
          return addMonths(billingDate, 1);
      }
    }
    
    return billingDate;
  };

  const getTotalByFrequency = (freqKey: string) => {
    const diasNoMes = getDaysInMonth(new Date());
    const diasNoAno = isLeapYear(new Date()) ? 366 : 365;

    return subscriptions.filter(sub => sub.active).reduce((sum, sub) => {
      const amount = Number(sub.amount);
      const period = normalizePeriod(sub.renewal_period);
      
      switch (freqKey) {
        case 'diario':
          switch (period) {
            case 'diario': return sum + amount;
            case 'semanal': return sum + amount / 7;
            case 'mensal': return sum + amount / diasNoMes;
            case 'trimestral': return sum + amount / (diasNoMes * 3);
            case 'anual': return sum + amount / diasNoAno;
            default: return sum + amount / diasNoMes;
          }
        case 'semanal':
          switch (period) {
            case 'diario': return sum + amount * 7;
            case 'semanal': return sum + amount;
            case 'mensal': return sum + amount / (diasNoMes / 7);
            case 'trimestral': return sum + amount / ((diasNoMes * 3) / 7);
            case 'anual': return sum + amount / (diasNoAno / 7);
            default: return sum + amount / (diasNoMes / 7);
          }
        case 'mensal':
          switch (period) {
            case 'diario': return sum + amount * diasNoMes;
            case 'semanal': return sum + amount * (diasNoMes / 7);
            case 'mensal': return sum + amount;
            case 'trimestral': return sum + amount / 3;
            case 'anual': return sum + amount / 12;
            default: return sum + amount;
          }
        case 'trimestral':
          switch (period) {
            case 'diario': return sum + amount * diasNoMes * 3;
            case 'semanal': return sum + amount * ((diasNoMes * 3) / 7);
            case 'mensal': return sum + amount * 3;
            case 'trimestral': return sum + amount;
            case 'anual': return sum + amount / 4;
            default: return sum + amount * 3;
          }
        case 'anual':
          switch (period) {
            case 'diario': return sum + amount * diasNoAno;
            case 'semanal': return sum + amount * (diasNoAno / 7);
            case 'mensal': return sum + amount * 12;
            case 'trimestral': return sum + amount * 4;
            case 'anual': return sum + amount;
            default: return sum + amount * 12;
          }
        default:
          return sum + amount;
      }
    }, 0);
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

  const nextMonthSubs = subscriptions
    .filter(sub => sub.active)
    .map(sub => ({
      ...sub,
      nextBillingDate: getNextBillingDate(sub)
    }))
    .filter(sub => {
      const today = new Date();
      const nextMonth = addMonths(today, 1);
      
      // Para assinaturas diárias, mostra as próximas 30 cobranças
      if (sub.renewal_period.toLowerCase() === 'diario') {
        const thirtyDaysFromNow = addDays(today, 30);
        return sub.nextBillingDate <= thirtyDaysFromNow;
      }
      
      // Para outras assinaturas, mostra as cobranças do próximo mês
      return sub.nextBillingDate <= nextMonth;
    })
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

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
          nextMonthSubs.map((subscription) => (
            <SubscriptionCard 
              key={subscription.id} 
              subscription={subscription}
              onPress={() => router.push({
                pathname: '/(screens)/subscription-details/[id]',
                params: { id: subscription.id }
              })}
              currencySymbol={currencySymbol}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Nenhuma assinatura com cobrança nos próximos 30 dias
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
  emptyState: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
});