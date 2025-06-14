import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDown } from 'lucide-react-native';

interface PaymentMethodPickerProps {
  value: string;
  onValueChange: (value: string) => void;
}

const PAYMENT_METHODS = [
  'Cartão de crédito',
  'Cartão de débito',
  'PIX',
  'Boleto',
  'PayPal',
  'Apple Pay / Google Pay',
  'Outro'
];

export default function PaymentMethodPicker({ value, onValueChange }: PaymentMethodPickerProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [customMethod, setCustomMethod] = useState('');

  const handleSelect = (method: string) => {
    onValueChange(method);
    if (method !== 'Outro') {
      setModalVisible(false);
    }
    setCustomMethod('');
  };

  const handleCustomMethodSubmit = () => {
    if (customMethod.trim()) {
      onValueChange(customMethod.trim());
      setModalVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.pickerButtonText, { color: colors.text }]}>
          {value || 'Selecione o método de pagamento'}
        </Text>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Método de Pagamento
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>

            {value === 'Outro' ? (
              <View style={styles.customMethodContainer}>
                <TextInput
                  style={[styles.customMethodInput, { 
                    backgroundColor: colors.card,
                    color: colors.text
                  }]}
                  placeholder="Digite o método de pagamento"
                  placeholderTextColor={colors.textSecondary}
                  value={customMethod}
                  onChangeText={setCustomMethod}
                  maxLength={50}
                />
                <TouchableOpacity
                  style={[styles.submitButton, { 
                    backgroundColor: colors.primary,
                    opacity: customMethod.trim() ? 1 : 0.5
                  }]}
                  onPress={handleCustomMethodSubmit}
                  disabled={!customMethod.trim()}
                >
                  <Text style={styles.submitButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.optionsContainer}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.option,
                      { backgroundColor: colors.card },
                      value === method && { backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => handleSelect(method)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: colors.text },
                      value === method && { color: colors.primary }
                    ]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    padding: 16,
    borderRadius: 8,
  },
  optionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  customMethodContainer: {
    gap: 16,
  },
  customMethodInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  submitButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
}); 