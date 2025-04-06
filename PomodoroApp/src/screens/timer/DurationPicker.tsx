import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DurationPickerProps {
  currentDuration: number;
  onChange: (newDuration: number) => void;
  minDuration?: number;
  maxDuration?: number;
  step?: number;
  label?: string;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  currentDuration,
  onChange,
  minDuration = 1,
  maxDuration = 60,
  step = 1,
  label = 'Süre'
}) => {
  const formatTime = (minutes: number) => {
    return `${minutes} dk`;
  };

  const handleIncrease = () => {
    if (currentDuration + step <= maxDuration) {
      onChange(currentDuration + step);
    }
  };

  const handleDecrease = () => {
    if (currentDuration - step >= minDuration) {
      onChange(currentDuration - step);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleDecrease}
          disabled={currentDuration <= minDuration}
        >
          <Ionicons 
            name="remove" 
            size={24} 
            color={currentDuration <= minDuration ? '#ccc' : '#FF5722'} 
          />
        </TouchableOpacity>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{formatTime(currentDuration)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleIncrease}
          disabled={currentDuration >= maxDuration}
        >
          <Ionicons 
            name="add" 
            size={24} 
            color={currentDuration >= maxDuration ? '#ccc' : '#FF5722'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  button: {
    padding: 10,
  },
  valueContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DurationPicker;
