import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { ArrowLeft, Calendar, Save } from 'lucide-react-native';
import DateTimePicker from '@/components/DateTimePicker';
import RenewalPeriodPicker from '@/components/RenewalPeriodPicker';
import CategoryPicker from '@/components/CategoryPicker';
import ColorPicker from '@/components/ColorPicker';
import PaymentMethodPicker from '@/components/PaymentMethodPicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AddSubscriptionScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const { addSubscription } = useSubscriptions();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDate, setBillingDate] = useState(new Date(new Date().toISOString().split('T')[0] + 'T00:00:00'));
  const [renewalPeriod, setRenewalPeriod] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setAmount('');
    setBillingDate(new Date(new Date().toISOString().split('T')[0] + 'T00:00:00'));
    setRenewalPeriod('');
    setCategory('');
    setColor('#3b82f6');
    setPaymentMethod('');
    setCustomPaymentMethod('');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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

  const handleSave = async () => {
    if (!session) {
      Alert.alert('Erro', 'Você precisa estar logado para adicionar uma assinatura');
      return;
    }

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
      await addSubscription({
        name,
        description,
        amount: numericAmount,
        billing_date: format(new Date(billingDate.getTime() + billingDate.getTimezoneOffset() * 60000), 'yyyy-MM-dd'),
        renewal_period: renewalPeriod,
        category,
        color,
        payment_method: paymentMethod === 'other' ? customPaymentMethod : paymentMethod,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      resetForm();
      Alert.alert(
        'Sucesso', 
        'Assinatura adicionada com sucesso',
        [{ text: 'OK', onPress: () => router.push('/(screens)/subscriptions') }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao adicionar a assinatura');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Adicionar Assinatura
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { opacity: isSubmitting ? 0.5 : 1 }]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Save size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Nome *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="ex.: Netflix"
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
            placeholder="ex.: Plano familiar"
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
          <Text style={[styles.label, { color: colors.text }]}>Valor *</Text>
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
          <Text style={[styles.label, { color: colors.text }]}>Data de Primeira Cobrança</Text>
          <TouchableOpacity
            style={[styles.datePickerButton, { backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
            {format(billingDate, 'dd/MM/yyyy', { locale: ptBR })}

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
          <Text style={[styles.label, { color: colors.text }]}>Período de Renovação *</Text>
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

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar Assinatura'}
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