import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Clock, ChevronDown, Check } from 'lucide-react-native';

type RenewalPeriodPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
};

const RENEWAL_PERIODS = [
  { label: 'Diário', value: 'diario' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensal', value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Anual', value: 'anual' },
];

export default function RenewalPeriodPicker({ value, onValueChange }: RenewalPeriodPickerProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedPeriod = RENEWAL_PERIODS.find(period => period.value === value);

  const handleSelect = (newValue: string) => {
    onValueChange(newValue);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: typeof RENEWAL_PERIODS[0] }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={[styles.optionText, { color: colors.text }]}>
        {item.label}
      </Text>
      {item.value === value && (
        <Check size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.pickerContent}>
          <Clock size={20} color={colors.primary} style={styles.pickerIcon} />
          <Text style={[styles.pickerText, { color: colors.text }]}>
            {selectedPeriod?.label || 'Selecione o Período'}
          </Text>
        </View>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Renewal Period
            </Text>
            
            <FlatList
              data={RENEWAL_PERIODS}
              keyExtractor={(item) => item.value}
              renderItem={renderItem}
              style={styles.optionsList}
            />
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.cardHighlight }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerIcon: {
    marginRight: 8,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});