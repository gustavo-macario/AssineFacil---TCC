import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Importando a localidade PT-BR
import { useTheme } from '@/context/ThemeContext';
import { CreditCard, DollarSign } from 'lucide-react-native';
import { Subscription } from '@/types';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress: () => void;
  currencySymbol: string;
}

export default function SubscriptionCard({ subscription, onPress, currencySymbol }: SubscriptionCardProps) {
  const { colors } = useTheme();
  const [imageError, setImageError] = useState(false);

  const getNextBillingDate = (): Date => {
    const billingDate = new Date(subscription.billing_date + 'T00:00:00');
    const today = new Date();
    
    // Se a data de cobrança já passou, calcula a próxima
    if (billingDate < today) {
      switch (subscription.renewal_period.toLowerCase()) {
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

  const nextBillingDate = getNextBillingDate();
  const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const getStatusColor = (): string => {
    if (!subscription.active) {
      return colors.textTertiary;
    }
    
    if (daysUntilBilling <= 3) {
      return colors.warning;
    }
    
    return colors.success;
  };

  const formatDate = (date: Date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <TouchableOpacity
      style={[ 
        styles.container, 
        { 
          backgroundColor: colors.card,
          borderLeftColor: subscription.color || colors.primary,
          opacity: subscription.active ? 1 : 0.7,
        }
      ]}
      onPress={onPress}
    >
      <View 
        style={[ 
          styles.iconContainer, 
          { backgroundColor: subscription.color || colors.primary }
        ]}
      >
        <Text style={styles.iconText}>
          {subscription.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{subscription.name}</Text>
        </View>
        {subscription.category && (
          <View style={[styles.categoryBadge, { backgroundColor: colors.cardHighlight }]}> 
            <Text style={[styles.categoryText, { color: colors.textSecondary }]}> 
              {subscription.category}
            </Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.periodText, { color: colors.textSecondary }]}> 
              {subscription.renewal_period.charAt(0).toUpperCase() + subscription.renewal_period.slice(1)}
            </Text>
            <Text style={[styles.dateText, { color: getStatusColor() }]}> 
              {subscription.active 
                ? `Próxima: ${formatDate(nextBillingDate)}` 
                : 'Inativa'}
            </Text>
            {subscription.payment_method && (
              <View style={styles.paymentMethodContainer}>
                {
                  [
                    'pix',
                    'boleto',
                    'paypal',
                    'apple pay / google pay',
                    'apple pay',
                    'google pay'
                  ].includes(subscription.payment_method.toLowerCase().trim()) ? (
                    <DollarSign size={14} color={colors.textSecondary} style={styles.paymentMethodIcon} />
                  ) : (
                    <CreditCard size={14} color={colors.textSecondary} style={styles.paymentMethodIcon} />
                  )
                }
                <Text style={[styles.paymentMethodText, { color: colors.textSecondary }]}> 
                  {subscription.payment_method}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: colors.text }]}>
          {currencySymbol} {Number(subscription.amount).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 24,
    height: 24,
  },
  iconText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: 'white',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginRight: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  detailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  periodText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginRight: 8,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  priceContainer: {
    justifyContent: 'flex-start',
    paddingLeft: 8,
    marginTop: 4,
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentMethodIcon: {
    marginRight: 4,
  },
  paymentMethodText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
});