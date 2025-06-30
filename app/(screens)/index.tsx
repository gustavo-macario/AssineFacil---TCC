import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useExpenses } from '@/context/ExpensesContext';
import { useCurrency } from '@/context/CurrencyContext';
import { addDays, isWithinInterval } from 'date-fns';
import { CreditCard, TrendingUp, Calendar, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Subscription } from '@/types';
import { useNextBillingDate } from '@/hooks/useNextBillingDate';

type SubscriptionWithBillingDate = Subscription & { nextBillingDate: Date };

function SubscriptionLoader({ subscription, onDateCalculated }: { subscription: Subscription, onDateCalculated: (subWithDate: SubscriptionWithBillingDate) => void }) {
  const { nextBillingDate, isLoading } = useNextBillingDate(subscription);

  useEffect(() => {
    if (!isLoading && nextBillingDate) {
      onDateCalculated({ ...subscription, nextBillingDate });
    }
  }, [isLoading, nextBillingDate, subscription]);

  return null;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { subscriptions, refreshSubscriptions } = useSubscriptions();
  const { monthlyCost, yearlyCost } = useExpenses();
  const { currencySymbol } = useCurrency();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<SubscriptionWithBillingDate[]>([]);

  useEffect(() => {
    setUpcomingSubscriptions([]);
  }, [subscriptions]);

  const handleDateCalculated = (subWithDate: SubscriptionWithBillingDate) => {
    setUpcomingSubscriptions(prevSubs => {
      if (prevSubs.find(s => s.id === subWithDate.id)) {
        return prevSubs;
      }
      return [...prevSubs, subWithDate];
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshSubscriptions();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [subscriptions]);

  const today = new Date();
  const sevenDaysFromNow = addDays(today, 7);

  const finalSubscriptions = upcomingSubscriptions
    .filter(sub => isWithinInterval(sub.nextBillingDate, { start: today, end: sevenDaysFromNow }))
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {subscriptions.filter(s => s.active).map(sub => (
        <SubscriptionLoader
          key={sub.id}
          subscription={sub}
          onDateCalculated={handleDateCalculated}
        />
      ))}

      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Olá, {session?.user?.user_metadata?.full_name || 'Usuário'}
        </Text>
        <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
          Monitore suas assinaturas de forma eficiente
        </Text>
      </View>

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

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Próximos 7 Dias</Text>
          <Calendar size={20} color={colors.primary} />
        </View>
        
        {finalSubscriptions.length > 0 ? (
          finalSubscriptions.map(subscription => (
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
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, padding: 20, borderRadius: 12 }]}>
            <Calendar size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 8 }]}>
              Nenhuma cobrança nos próximos 7 dias
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
