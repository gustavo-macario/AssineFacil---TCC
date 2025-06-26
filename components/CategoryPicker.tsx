import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { Tag, ChevronDown, Check } from 'lucide-react-native';

type CategoryPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export default function CategoryPicker({ value, onValueChange }: CategoryPickerProps) {
  const { colors } = useTheme();
  const { allCategories } = useSubscriptions();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelect(item)}
    >
      <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
      {item === value && <Check size={20} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.pickerContent}>
          <Tag size={20} color={colors.primary} style={styles.pickerIcon} />
          <Text style={[styles.pickerText, { color: value ? colors.text : colors.textSecondary }]}>
            {value || 'Selecione a Categoria'}
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
              Selecione a Categoria
            </Text>
            
            <FlatList
              data={allCategories}
              keyExtractor={(item) => item}
              renderItem={renderItem}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerButton: { height: 48, borderRadius: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerContent: { flexDirection: 'row', alignItems: 'center' },
  pickerIcon: { marginRight: 8 },
  pickerText: { fontFamily: 'Inter-Regular', fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 20 },
  modalContent: { borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalTitle: { fontFamily: 'Inter-SemiBold', fontSize: 18, marginBottom: 16, textAlign: 'center' },
  optionsList: { maxHeight: 300 },
  optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  optionText: { fontFamily: 'Inter-Regular', fontSize: 16 },
});