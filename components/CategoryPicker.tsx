import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useSubscriptions } from '@/context/SubscriptionContext';
import { Tag, ChevronDown, Check, Plus, Trash2 } from 'lucide-react-native';

type CategoryPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export default function CategoryPicker({ value, onValueChange }: CategoryPickerProps) {
  const { colors } = useTheme();
  const {
    allCategories,
    customCategories,
    addCustomCategory,
    deleteCustomCategory
  } = useSubscriptions();

  const [modalVisible, setModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setModalVisible(false);
  };

  const handleAddCategory = async () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory) {
      const existingCategory = allCategories.find(cat => cat.toLowerCase() === trimmedCategory.toLowerCase());
      if (existingCategory) {
        Alert.alert('Categoria Existente', `A categoria "${existingCategory}" já existe.`);
        onValueChange(existingCategory);
      } else {
        await addCustomCategory(trimmedCategory);
        onValueChange(trimmedCategory);
      }
      setNewCategory('');
      setModalVisible(false);
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    Alert.alert(
      'Excluir Categoria',
      `Tem certeza de que deseja excluir a categoria "${categoryToDelete}"? Todas as assinaturas que usam esta categoria serão movidas para "Outro".`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            await deleteCustomCategory(categoryToDelete);
            if (value === categoryToDelete) {
              onValueChange('');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: string }) => {
    const isCustom = customCategories.includes(item);

    return (
      <View style={styles.optionItemContainer}>
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => handleSelect(item)}
        >
          <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
          {item === value && <Check size={20} color={colors.primary} />}
        </TouchableOpacity>
        {isCustom && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteCategory(item)}
          >
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
            
            <View style={styles.addCategoryContainer}>
              <TextInput
                style={[styles.addCategoryInput, { backgroundColor: colors.cardHighlight, color: colors.text }]}
                placeholder="Adicionar nova categoria"
                placeholderTextColor={colors.textSecondary}
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                <Plus size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={allCategories}
              keyExtractor={(item) => item}
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
  addCategoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addCategoryInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
  },
  optionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flexShrink: 1,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
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