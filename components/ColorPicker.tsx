import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Check } from 'lucide-react-native';

type ColorPickerProps = {
  selectedColor: string;
  onSelectColor: (color: string) => void;
};

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#10b981', // green
  '#f97316', // orange
  '#6366f1', // indigo
  '#ec4899', // pink
  '#84cc16', // lime
  '#64748b', // slate
  '#0ea5e9', // sky
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