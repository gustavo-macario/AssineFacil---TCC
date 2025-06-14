import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import DateTimePickerNative from '@react-native-community/datetimepicker';

type DateTimePickerProps = {
  isVisible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  mode?: 'date' | 'time' | 'datetime';
};

export default function DateTimePicker({
  isVisible,
  date,
  onConfirm,
  onCancel,
  mode = 'date',
}: DateTimePickerProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = React.useState(date);

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleChange = (event: any, newDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && newDate) {
        setSelectedDate(newDate);
        onConfirm(newDate);
      } else {
        onCancel();
      }
    } else if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  if (Platform.OS === 'android') {
    if (!isVisible) return null;

    return (
      <DateTimePickerNative
        value={selectedDate}
        mode={mode}
        display="default"
        onChange={handleChange}
      />
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Select Date</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <DateTimePickerNative
            value={selectedDate}
            mode={mode}
            display="spinner"
            onChange={handleChange}
            textColor={colors.text}
            style={{ backgroundColor: colors.card }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
});