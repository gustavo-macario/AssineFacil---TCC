import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { supabase } from '@/lib/supabase';
import { Bell, Check, X } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Subscription, Notification } from '@/types';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { currencySymbol } = useCurrency();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [notificationsRes, subscriptionsRes] = await Promise.all([
          supabase.from('notifications').select('*').eq('user_id', session.user.id).order('notification_date', { ascending: false }),
          supabase.from('subscriptions').select('*').eq('user_id', session.user.id).eq('active', true)
        ]);

        if (notificationsRes.error) throw notificationsRes.error;
        if (subscriptionsRes.error) throw subscriptionsRes.error;

        setNotifications(notificationsRes.data || []);
        setSubscriptions(subscriptionsRes.data || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session?.user.id]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}></Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={[styles.clearButton, { backgroundColor: colors.card }]}
            onPress={() => {
              Alert.alert(
                'Limpar Notificações',
                'Tem certeza que deseja marcar todas as notificações como lidas?',
                [
                  {
                    text: 'Cancelar',
                    style: 'cancel'
                  },
                  {
                    text: 'Marcar como lidas',
                    onPress: clearAllNotifications
                  }
                ]
              );
            }}
          >
            <Text style={[styles.clearButtonText, { color: colors.primary }]}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Nenhuma notificação
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  notificationIconContainer: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});
