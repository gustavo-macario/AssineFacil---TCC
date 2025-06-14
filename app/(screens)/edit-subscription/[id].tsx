import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, Save } from 'lucide-react-native';
import DateTimePicker from '@/components/DateTimePicker';
import RenewalPeriodPicker from '@/components/RenewalPeriodPicker';
import CategoryPicker from '@/components/CategoryPicker';
import ColorPicker from '@/components/ColorPicker';
import PaymentMethodPicker from '@/components/PaymentMethodPicker';
import { Subscription } from '@/types';

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { updateSubscription } = useSubscriptions();
  const { session } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDate, setBillingDate] = useState(new Date());
  const [renewalPeriod, setRenewalPeriod] = useState('monthly');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [active, setActive] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const fetchSubscription = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setSubscription(data);
        setName(data.name);
        setDescription(data.description || '');
        setAmount(data.amount.toString());
        setBillingDate(new Date(data.billing_date));
        setRenewalPeriod(data.renewal_period);
        setCategory(data.category || '');
        setColor(data.color || '#3b82f6');
        setActive(data.active);
        setPaymentMethod(data.payment_method || '');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      Alert.alert('Erro', 'Falha ao carregar os detalhes da assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !amount || !renewalPeriod) {
      Alert.alert('Erro', 'Nome, valor e período de renovação são obrigatórios');
      return;
    }

    if (name.length > 50) {
      Alert.alert('Erro', 'O nome deve ter no máximo 50 caracteres');
      return;
    }

    if (description.length > 100) {
      Alert.alert('Erro', 'A descrição deve ter no máximo 100 caracteres');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount)) {
      Alert.alert('Erro', 'O valor deve ser um número válido');
      return;
    }

    if (numericAmount > 99999) {
      Alert.alert('Erro', 'O valor máximo permitido é 99.999');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateSubscription(id, {
        name,
        description,
        amount: numericAmount,
        billing_date: billingDate.toISOString().split('T')[0],
        renewal_period: renewalPeriod,
        category,
        color,
        payment_method: paymentMethod,
        active,
        updated_at: new Date().toISOString(),
      });

      Alert.alert(
        'Sucesso', 
        'Assinatura atualizada com sucesso',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar a assinatura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (text: string) => {
    // Remove caracteres não numéricos exceto ponto e vírgula
    let cleanedText = text.replace(/[^\d.,]/g, '');
    // Limita a 5 dígitos antes da vírgula/ponto
    const parts = cleanedText.split(/[.,]/);
    if (parts[0].length > 5) {
      cleanedText = parts[0].slice(0, 5) + (parts[1] ? cleanedText.slice(parts[0].length) : '');
    }
    setAmount(cleanedText);
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
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Editar Assinatura
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { opacity: isSubmitting ? 0.5 : 1 }]}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          <Save size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="ex: Netflix"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
          <Text style={[styles.characterCount, { color: colors.textSecondary }]}> 
            {name.length}/50
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Descrição (Opcional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="ex: Plano familiar"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={100}
          />
          <Text style={[styles.characterCount, { color: colors.textSecondary }]}> 
            {description.length}/100
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Valor</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="0,00"
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Método de Pagamento (Opcional)</Text>
          <PaymentMethodPicker
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Data de Cobrança</Text>
          <TouchableOpacity
            style={[styles.datePickerButton, { backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {billingDate.toLocaleDateString()}
            </Text>
            <Calendar size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <DateTimePicker 
            isVisible={showDatePicker}
            date={billingDate}
            onConfirm={(date) => {
              setBillingDate(date);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Período de Renovação</Text>
          <RenewalPeriodPicker
            value={renewalPeriod}
            onValueChange={setRenewalPeriod}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Categoria (Opcional)</Text>
          <CategoryPicker
            value={category}
            onValueChange={setCategory}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Cor</Text>
          <ColorPicker
            selectedColor={color}
            onSelectColor={setColor}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Status</Text>
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[ 
                styles.statusButton, 
                { 
                  backgroundColor: active ? colors.primary : colors.card,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setActive(true)}
            >
              <Text 
                style={[ 
                  styles.statusText, 
                  { color: active ? 'white' : colors.text }
                ]}
              >
                Ativo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[ 
                styles.statusButton, 
                { 
                  backgroundColor: !active ? colors.error : colors.card,
                  borderWidth: !active ? 0 : 1,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setActive(false)}
            >
              <Text 
                style={[ 
                  styles.statusText, 
                  { color: !active ? 'white' : colors.text }
                ]}
              >
                Inativo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Atualizando...' : 'Atualizar Assinatura'}
          </Text>
        </TouchableOpacity>
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
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
  },
  datePickerButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: 'Inter-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  characterCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
  },
});