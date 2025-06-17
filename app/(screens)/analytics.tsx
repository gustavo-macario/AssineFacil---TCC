import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useExpenses } from '@/context/ExpensesContext';
import { ChartPie as PieChart, TrendingUp, DollarSign, CreditCard, RefreshCw } from 'lucide-react-native';
import { format, getDaysInMonth, isLeapYear, subMonths, addMonths } from 'date-fns';
import SubscriptionChart from '@/components/SubscriptionChart';
import { Subscription } from '@/types';
import { useCurrency } from '@/context/CurrencyContext';

const FREQUENCIES = [
  { key: 'mensal', label: 'Mensal' },
  { key: 'trimestral', label: 'Trimestral' },
  { key: 'anual', label: 'Anual' },
  { key: 'diario', label: 'Diário' },
  { key: 'semanal', label: 'Semanal' },
];

export default function AnalyticsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { currencySymbol } = useCurrency();
  const { subscriptions } = useSubscriptions();
  const { monthlyCost, yearlyCost, getTotalByFrequency, normalizePeriod } = useExpenses();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [topSubscriptions, setTopSubscriptions] = useState<Subscription[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [selectedFrequencyIndex, setSelectedFrequencyIndex] = useState(0);

  const daysInCurrentMonth = getDaysInMonth(currentMonth);
  const daysInCurrentYear = isLeapYear(currentMonth) ? 366 : 365;

  useEffect(() => {
    if (session) {
      const activeSubscriptions = subscriptions.filter(sub => sub.active);
      calculateCategoryBreakdown(activeSubscriptions);
      setTopSubscriptions(sortByAmount(activeSubscriptions).slice(0, 5));
      setIsLoading(false);
    }
  }, [session, subscriptions, currentMonth, daysInCurrentMonth, daysInCurrentYear]);

  useEffect(() => {
    if (categoryBreakdown.length === 1) {
      const singleItem = categoryBreakdown[0];
      let dummyAmount = singleItem.amount * 0.0001;
      
      if (singleItem.amount > 0 && dummyAmount === 0) {
        dummyAmount = 0.000001; 
      }

      setPieChartData([
        singleItem,
        {
          category: 'dummy_slice_for_rendering', 
          amount: dummyAmount,
          color: colors.card 
        }
      ]);
    } else {
      setPieChartData(categoryBreakdown);
    }
  }, [categoryBreakdown, colors.card]);

  const calculateCategoryBreakdown = (subs: Subscription[]) => {
    const categories: { [key: string]: number } = {};
    
    subs.forEach((sub) => {
      const category = sub.category || 'Não categorizado';
      const monthlyCost = calculateMonthlyCost(sub, daysInCurrentMonth); 
      
      if (categories[category]) {
        categories[category] += monthlyCost;
      } else {
        categories[category] = monthlyCost;
      }
    });
    
    const breakdown = Object.entries(categories)
      .map(([category, amount], index) => ({
        category,
        amount,
        color: getColorForCategory(category, index),
      }))
      .sort((a, b) => b.amount - a.amount);
    
    setCategoryBreakdown(breakdown);
  };

  const calculateMonthlyCost = (subscription: Subscription, daysInMonth: number) => {
    const amount = Number(subscription.amount);
    const period = normalizePeriod(subscription.renewal_period);
    switch (period) {
      case 'diario':
        return amount * daysInMonth;
      case 'semanal':
        return amount * (daysInMonth / 7);
      case 'mensal':
        return amount;
      case 'trimestral':
        return amount / 3;
      case 'anual':
        return amount / 12;
      default:
        return amount;
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

  const getColorForCategory = (category: string, index: number) => {
    return generateColorFromString(category);
  };

  const sortByAmount = (subs: Subscription[]) => {
    return [...subs].sort((a, b) => {
      const aMonthlyCost = calculateMonthlyCost(a, daysInCurrentMonth); 
      const bMonthlyCost = calculateMonthlyCost(b, daysInCurrentMonth);
      return bMonthlyCost - aMonthlyCost;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleNextFrequency = () => {
    setSelectedFrequencyIndex((prev) => (prev + 1) % FREQUENCIES.length);
  };

  const selectedFrequency = FREQUENCIES[selectedFrequencyIndex];
  const totalBySelectedFrequency = getTotalByFrequency(selectedFrequency.key);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalCategoryCost = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  const getPeriodLabel = (period: string) => {
    const norm = normalizePeriod(period);
    switch (norm) {
      case 'diario': return 'Diário';
      case 'semanal': return 'Semanal';
      case 'mensal': return 'Mensal';
      case 'trimestral': return 'Trimestral';
      case 'anual': return 'Anual';
      default: return norm.charAt(0).toUpperCase() + norm.slice(1);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryIconContainer}>
            <CreditCard size={24} color={colors.primary} />
          </View>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Mensal</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {currencySymbol}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {monthlyCost.toFixed(2)}
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryIconContainer}>
            <DollarSign size={24} color="#8b5cf6" />
          </View>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Anual</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {currencySymbol}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {yearlyCost.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Gastos por Categoria</Text>
          <PieChart size={20} color={colors.primary} />
        </View>
        
        <SubscriptionChart data={pieChartData} />
        
        <View style={styles.legendContainer}>
          {categoryBreakdown.map((item, index) => {
            const percentage = totalCategoryCost > 0 ? (item.amount / totalCategoryCost) * 100 : 0;
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  {item.category} - {`${currencySymbol} ${item.amount.toFixed(2)}`} ({percentage.toFixed(1)}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Gastos por Frequência */}
      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}> 
        <Text style={[styles.chartTitle, { color: colors.text }]}>Gastos por frequência</Text>
        <View style={styles.frequencySwitchContainer}>
          <TouchableOpacity style={styles.frequencySwitch} onPress={handleNextFrequency} activeOpacity={0.7}>
            <RefreshCw size={18} color={colors.primary} />
            <Text style={[styles.frequencyLabel, { color: colors.primary, marginLeft: 8 }]}> {selectedFrequency.label} </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.frequencyValueContainer}>
          <Text style={[styles.frequencyValue, { color: colors.text }]}> 
            {currencySymbol} {totalBySelectedFrequency.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Top Assinaturas</Text>
          <TrendingUp size={20} color={colors.primary} />
        </View>
        
        {topSubscriptions.map((sub, index) => (
          <View key={sub.id} style={styles.topSubscriptionItem}>
            <View 
              style={[styles.rankBadge, 
                { backgroundColor: index === 0 ? '#f59e0b' : colors.primary }
              ]}
            >
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.subscriptionDetails}>
              <Text style={[styles.subscriptionName, { color: colors.text }]}>{sub.name}</Text>
              <Text style={[styles.subscriptionPeriod, { color: colors.textSecondary }]}>
                {getPeriodLabel(sub.renewal_period)}
              </Text>
            </View>
            <Text style={[styles.subscriptionAmount, { color: colors.text }]}>
              {`${currencySymbol} ${Number(sub.amount).toFixed(2)}`}
            </Text>
          </View>
        ))}
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
  screenTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    textAlign: 'center',
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthNavButton: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    paddingHorizontal: 8,
  },
  currentMonth: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  monthlyChartPlaceholder: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  topSubscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: 'white',
  },
  subscriptionDetails: {
    flex: 1,
  },
  subscriptionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  subscriptionPeriod: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  subscriptionAmount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  frequencySwitchContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  frequencySwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  frequencyLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  frequencyValueContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  frequencyValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
  },
});