import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChartPie } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import SubscriptionChart from '@/components/SubscriptionChart';

export default function AdminScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!session?.user.id) {
      router.replace('/');
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!session?.user.id) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error checking admin access on focus:', profileError);
            router.replace('/');
            return;
          }

          if (profileData?.role !== 'admin') {
            console.log('User is not admin on focus, redirecting...');
            router.replace('/');
            return;
          }

          await fetchAdminStats();
        } catch (error) {
          console.error('Error in useFocusEffect admin check:', error);
          Alert.alert('Erro', 'Ocorreu um erro ao verificar o acesso.');
          router.replace('/');
        }
      };

      fetchData();

      return () => {
        // Opcional: lógica de limpeza se necessário quando a tela perde o foco
        // Por exemplo, cancelar subscriptions, etc.
        // Neste caso, não parece ser necessário limpar nada especificamente.
      };
    }, [session, router])
  );

  const fetchAdminStats = async () => {
    if (!session?.user?.id) {
        router.replace('/');
        setIsLoading(false);
        return;
    }

    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      if (usersError) throw usersError;

      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Filtra apenas as assinaturas ativas
      const activeSubscriptions = subscriptions.filter(sub => sub.active);

      const totalUsers = users.length;
      const totalSubscriptions = activeSubscriptions.length;
      const totalRevenue = activeSubscriptions.reduce((acc, sub) => acc + (sub.amount || 0), 0);

      const subscriptionsByCategory = activeSubscriptions.reduce((acc: any, sub) => {
        const category = sub.category || 'Sem categoria';
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            amount: 0
          };
        }
        acc[category].count += 1;
        acc[category].amount += sub.amount || 0;
        return acc;
      }, {});

      const categoryData = Object.entries(subscriptionsByCategory)
        .map(([category, data]: [string, any], index) => ({
          category,
          amount: data.count,
          color: generateColorFromString(category)
        }))
        .sort((a, b) => b.amount - a.amount);

      const subscriptionsByUser = users.map(user => {
        const userSubscriptions = activeSubscriptions.filter(sub => sub.user_id === user.id);
        return {
          id: user.id,
          name: user.full_name || user.email,
          email: user.email,
          totalSubscriptions: userSubscriptions.length,
          totalSpent: userSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0)
        };
      });

      setStats({
        totalUsers,
        totalSubscriptions,
        totalRevenue,
        subscriptionsByCategory: categoryData,
        subscriptionsByUser
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateColorFromString = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;

    const C_MIN = 50;
    const C_RANGE = 155;

    const finalR = C_MIN + (Math.abs(r) % C_RANGE);
    const finalG = C_MIN + (Math.abs(g) % C_RANGE);
    const finalB = C_MIN + (Math.abs(b) % C_RANGE);

    return `#${((1 << 24) + (finalR << 16) + (finalG << 8) + finalB).toString(16).slice(1).toUpperCase()}`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Visão Geral</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.totalUsers}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total de Usuários</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats?.totalSubscriptions}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total de Assinaturas</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              R$ {stats?.totalRevenue.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Receita Total</Text>
          </View>
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Assinaturas por Categoria</Text>
          <ChartPie size={20} color={colors.primary} />
        </View>
        
        {stats?.subscriptionsByCategory && stats.subscriptionsByCategory.length > 0 ? (
          <>
            <SubscriptionChart data={stats.subscriptionsByCategory} />
            
            <View style={styles.legendContainer}>
              {stats.subscriptionsByCategory.map((item: any, index: number) => {
                const total = stats.subscriptionsByCategory.reduce((sum: number, i: any) => sum + i.amount, 0);
                const percentage = total > 0 ? (item.amount / total) * 100 : 0;
                return (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendText, { color: colors.text }]}>
                      {item.category} - {item.amount} ({percentage.toFixed(1)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Nenhuma assinatura encontrada
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.usersContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Usuários</Text>
        {stats?.subscriptionsByUser && stats.subscriptionsByUser.length > 0 ? (
          stats.subscriptionsByUser.map((user: any) => (
            <View key={user.id} style={[styles.userCard, { backgroundColor: colors.background }]}>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
              </View>
              <View style={styles.userStats}>
                <Text style={[styles.userStat, { color: colors.primary }]}>
                  {user.totalSubscriptions} assinaturas
                </Text>
                <Text style={[styles.userStat, { color: colors.primary }]}>
                  R$ {user.totalSpent.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Nenhum usuário encontrado
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  usersContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  userCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  userInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userStat: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 