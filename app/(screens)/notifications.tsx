import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';
import { Bell, Check, Calendar, CircleAlert as AlertCircle, X } from 'lucide-react-native';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Subscription, Notification } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { currencySymbol } = useCurrency();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(3);
  const [isGeneratingNotifications, setIsGeneratingNotifications] = useState(false);
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();
    let isMounted = true;

    const fetchDataAndGenerate = async () => {
      try {
        console.log('[DEBUG] Iniciando fetchData');
        setIsLoading(true);

        if (isGeneratingNotifications) {
          console.log('[DEBUG] Geração já em andamento - abortando');
          return;
        }

        const [settingsRes, notificationsRes, subscriptionsRes] = await Promise.all([
          supabase.from('user_settings').select('*').eq('id', session.user.id).single(),
          supabase.from('notifications').select('*').eq('user_id', session.user.id).order('notification_date', { ascending: false }),
          supabase.from('subscriptions').select('*').eq('user_id', session.user.id).eq('active', true)
        ]);

        if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;
        if (notificationsRes.error) throw notificationsRes.error;
        if (subscriptionsRes.error) throw subscriptionsRes.error;

        if (isMounted) {
          if (settingsRes.data) {
            setNotificationsEnabled(settingsRes.data.notification_enabled);
            setReminderDays(settingsRes.data.reminder_days);
          }
          setNotifications(notificationsRes.data || []);
          setSubscriptions(subscriptionsRes.data || []);
        }

        const today = new Date().toISOString().split('T')[0];
        const lastCheck = await AsyncStorage.getItem('lastNotificationCheck');
        setLastCheckDate(lastCheck);

        if ((lastCheck !== today || !lastCheck) && settingsRes.data?.notification_enabled) {
          console.log('[DEBUG] Iniciando geração de notificações');
          setIsGeneratingNotifications(true);
          await generateUpcomingReminders(subscriptionsRes.data || [], settingsRes.data?.reminder_days || 3);
          await AsyncStorage.setItem('lastNotificationCheck', today);
          setLastCheckDate(today);
        }
      } catch (error) {
        console.error('[DEBUG] Erro:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsGeneratingNotifications(false);
        }
      }
    };

    fetchDataAndGenerate();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [session?.user.id, notificationsEnabled]);

  const getNextBillingDate = (sub: Subscription): Date => {
    const billingDate = new Date(sub.billing_date);
    const today = new Date();
    
    // Se a data de cobrança já passou, calcula a próxima
    if (billingDate < today) {
      switch (sub.renewal_period.toLowerCase()) {
        case 'diário':
          return addDays(billingDate, 1);
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

  const generateUpcomingReminders = async (subs: Subscription[], days: number) => {
    try {
      console.log('[DEBUG] Iniciando geração de lembretes');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session?.user.id)
        .gte('notification_date', today.toISOString())
        .lt('notification_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const existingKeys = new Set(
        todayNotifications?.map(n => 
          `${n.subscription_id}_${n.title}_${new Date(n.notification_date).toISOString().split('T')[0]}`
        ) || []
      );

      const newNotifications = [];

      for (const sub of subs) {
        const nextBillingDate = getNextBillingDate(sub);
        nextBillingDate.setHours(0, 0, 0, 0);
        const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilBilling === 0) {
          const key = `${sub.id}_Renovação Hoje_${today.toISOString().split('T')[0]}`;
          if (!existingKeys.has(key)) {
            newNotifications.push({
              user_id: session?.user.id,
              subscription_id: sub.id,
              title: 'Renovação Hoje',
              message: `Sua assinatura ${sub.name} é renovada hoje. Valor: ${currencySymbol} ${Number(sub.amount).toFixed(2)}`,
              notification_date: new Date(),
              is_read: false
            });
            existingKeys.add(key);
          }
        }

        [3, 2, 1].forEach(day => {
          if (daysUntilBilling === day) {
            const title = `Lembrete: ${day} dia${day !== 1 ? 's' : ''} para pagamento`;
            const key = `${sub.id}_${title}_${today.toISOString().split('T')[0]}`;
            if (!existingKeys.has(key)) {
              newNotifications.push({
                user_id: session?.user.id,
                subscription_id: sub.id,
                title,
                message: `Sua assinatura ${sub.name} será cobrada em ${day} dia${day !== 1 ? 's' : ''}. Valor: ${currencySymbol} ${Number(sub.amount).toFixed(2)}`,
                notification_date: new Date(),
                is_read: false
              });
              existingKeys.add(key);
            }
          }
        });
      }

      if (newNotifications.length > 0) {
        const { data, error: insertError } = await supabase
          .from('notifications')
          .insert(newNotifications)
          .select();

        if (insertError) throw insertError;

        if (data) {
          setNotifications(prev => [...data, ...prev]);
        }
      }
    } catch (error) {
      console.error('[DEBUG] Erro na geração:', error);
      throw error;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session?.user.id);
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      
      const { error } = await supabase
        .from('user_settings')
        .update({ notification_enabled: value })
        .eq('id', session?.user.id);

      if (error) throw error;

      if (value) {
        await generateUpcomingReminders(subscriptions, reminderDays);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações de notificação:', error);
      setNotificationsEnabled(!value);
      Alert.alert('Erro', 'Não foi possível atualizar as configurações de notificação.');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      Alert.alert('Erro', 'Não foi possível excluir a notificação.');
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const subscription = subscriptions.find(sub => sub.id === item.subscription_id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { 
            backgroundColor: item.is_read ? colors.card : colors.cardHighlight,
            borderLeftColor: item.is_read ? colors.border : colors.primary,
          }
        ]}
        onPress={() => {
          markAsRead(item.id);
          if (subscription) {
            router.push({
              pathname: '/(screens)/subscription-details/[id]',
              params: { id: subscription.id }
            });
          }
        }}
      >
        <View style={styles.notificationIconContainer}>
          {item.is_read ? (
            <Check size={20} color={colors.success} />
          ) : (
            <Bell size={20} color={colors.primary} />
          )}
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
            {item.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {format(new Date(item.notification_date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Excluir Notificação',
              'Tem certeza que deseja excluir esta notificação?',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel'
                },
                {
                  text: 'Excluir',
                  onPress: () => deleteNotification(item.id),
                  style: 'destructive'
                }
              ]
            );
          }}
        >
          <X size={20} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}></Text>
        {notifications.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllNotifications}
          >
            <Text style={[styles.clearButtonText, { color: colors.primary }]}>
              Marcar todas como lidas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 ? (
        <View style={[styles.countContainer, { backgroundColor: colors.primary }]}>
          <Bell size={16} color="white" />
          <Text style={styles.countText}>
            {unreadCount} notificações não lida{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.notificationsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sem notificações
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você receberá alertas aqui sobre os próximos pagamentos de assinaturas
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  countText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
  notificationsList: {
    paddingBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  notificationIconContainer: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  notificationTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
  },
});
