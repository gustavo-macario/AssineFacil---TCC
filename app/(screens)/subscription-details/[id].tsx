import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Tag, RefreshCw, CreditCard } from 'lucide-react-native';
import { format, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Subscription } from '@/types';

export default function SubscriptionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { currencySymbol } = useCurrency();
  const { subscriptions, deleteSubscription } = useSubscriptions();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextBillingDates, setNextBillingDates] = useState<Date[]>([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) {
      const foundSubscription = subscriptions.find(sub => sub.id === id);
      if (foundSubscription) {
        setSubscription(foundSubscription);
        setNextBillingDates(calculateNextBillingDates(foundSubscription));
      } else {
        router.push('/(screens)');
      }
      setIsLoading(false);
    }
  }, [id, subscriptions]);

  const calculateNextBillingDates = (sub: Subscription): Date[] => {
    let lastDate = new Date(sub.billing_date + 'T00:00:00');
    const dates: Date[] = [];

    const period = sub.renewal_period.trim().toLowerCase();

    for (let i = 0; i < 3; i++) {
      switch (period) {
        case 'diário':
          lastDate = addDays(lastDate, 1);
          break;
        case 'semanal':
          lastDate = addWeeks(lastDate, 1);
          break;
        case 'mensal':
          lastDate = addMonths(lastDate, 1);
          break;
        case 'trimestral':
          lastDate = addQuarters(lastDate, 1);
          break;
        case 'anual':
          lastDate = addYears(lastDate, 1);
          break;
        default:
          console.warn(`Período de renovação desconhecido: "${sub.renewal_period}", assumindo "mensal".`);
          lastDate = addMonths(lastDate, 1);
      }
      dates.push(lastDate);
    }

    return dates;
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(screens)/edit-subscription/[id]',
      params: { id }
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Assinatura',
      'Tem certeza de que deseja excluir esta assinatura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              router.push('/(screens)');
              await deleteSubscription(id);
              Alert.alert('Sucesso', 'Assinatura excluída com sucesso');
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Falha ao excluir a assinatura');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Assinatura não encontrada
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes da Assinatura</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Pencil size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={[styles.subscriptionHeader, { backgroundColor: subscription.color || colors.primary }]}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>{subscription.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.subscriptionName}>{subscription.name}</Text>
            <Text style={styles.subscriptionAmount}>
              {currencySymbol}{Number(subscription.amount).toFixed(2)}
              <Text style={styles.renewalText}>
                /{subscription.renewal_period.toLowerCase()}
              </Text>
            </Text>
          </View>

          {subscription.description && (
            <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>Descrição</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{subscription.description}</Text>
            </View>
          )}

          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Calendar size={20} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Data de Faturamento</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {format(new Date(subscription.billing_date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <RefreshCw size={20} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Período de Renovação</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {subscription.renewal_period.charAt(0).toUpperCase() + subscription.renewal_period.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          {subscription.category && (
            <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Tag size={20} color={colors.primary} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailTitle, { color: colors.text }]}>Categoria</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{subscription.category}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <CreditCard size={20} color={colors.primary} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>Método de Pagamento</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {subscription.payment_method || 'Não informado'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>Próximos Pagamentos</Text>

            {nextBillingDates.map((date, index) => (
              <View key={index} style={styles.paymentRow}>
                <Clock size={16} color={colors.primary} style={styles.paymentIcon} />
                <Text style={[styles.paymentDate, { color: colors.text }]}>
                  {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
                <Text style={[styles.paymentAmount, { color: colors.text }]}>
                  {currencySymbol}{Number(subscription.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error }]}
              onPress={handleDelete}
            >
              <Trash2 size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Excluir Assinatura</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  subscriptionHeader: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: 'white',
  },
  subscriptionName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: 'white',
    marginBottom: 8,
  },
  subscriptionAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: 'white',
  },
  renewalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  paymentIcon: {
    marginRight: 8,
  },
  paymentDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flex: 1,
  },
  paymentAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  deleteButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
});