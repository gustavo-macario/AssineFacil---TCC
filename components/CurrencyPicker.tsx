import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Check } from 'lucide-react-native';

const currencies = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar Canadense' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano' },
  { code: 'CHF', symbol: 'Fr', name: 'Franco Suíço' },
];

interface CurrencyPickerProps {
  value: string;
  onValueChange: (value: string) => void;
}

export default function CurrencyPicker({ value, onValueChange }: CurrencyPickerProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCurrency = currencies.find(currency => currency.code === value) || currencies[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {selectedCurrency.code} - {selectedCurrency.name}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione a Moeda</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={currencies}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.currencyItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onValueChange(item.code);
                    setModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.currencyCode, { color: colors.text }]}>
                      {item.code} - {item.symbol}
                    </Text>
                    <Text style={[styles.currencyName, { color: colors.textSecondary }]}>
                      {item.name}
                    </Text>
                  </View>
                  {value === item.code && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  currencyCode: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  currencyName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
}); 