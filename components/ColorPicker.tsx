import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Check } from 'lucide-react-native';

type ColorPickerProps = {
  selectedColor: string;
  onSelectColor: (color: string) => void;
};

const COLORS = [
  '#ef4444', // Vermelho 
  '#f97316', // Laranja 
  '#eab308', // Amarelo 
  '#84cc16', // Lima 
  '#22c55e', // Verde 
  '#14b8a6', // Turquesa 
  '#06b6d4', // Ciano 
  '#3b82f6', // Azul 
  '#6366f1', // Índigo 
  '#a855f7', // Roxo 
  '#ec4899', // Rosa 
  '#78716c', // Neutro/Pedra 
];

export default function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  const handleColorSelect = (color: string) => {
    onSelectColor(color);
  };

  return (
    <View style={styles.container}>
      {COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          style={[styles.colorItem, { backgroundColor: color }]}
          onPress={() => handleColorSelect(color)}
        >
          {color === selectedColor && (
            <Check size={24} color="white" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});