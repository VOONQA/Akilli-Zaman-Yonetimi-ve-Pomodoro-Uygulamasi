import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import SettingsItem from './SettingsItem';

interface SliderItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  valueFormat?: (value: number) => string;
}

const SliderItem: React.FC<SliderItemProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  valueFormat,
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleChangeText = (text: string) => {
    setLocalValue(text);
  };

  const handleEndEditing = () => {
    let numValue = parseInt(localValue, 10);
    
    // Sınır kontrolleri
    if (isNaN(numValue)) {
      numValue = value;
    } else if (numValue < minimumValue) {
      numValue = minimumValue;
    } else if (numValue > maximumValue) {
      numValue = maximumValue;
    }
    
    setLocalValue(numValue.toString());
    onValueChange(numValue);
  };

  const formattedValue = valueFormat ? valueFormat(value) : `${value}`;
  const unit = formattedValue.split(' ')[1] || '';

  return (
    <SettingsItem
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      rightComponent={
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={localValue}
            onChangeText={handleChangeText}
            onEndEditing={handleEndEditing}
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 100, // Sabit genişlik vererek hizalamaları düzeltiyoruz
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 50,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  unitText: {
    marginLeft: 4,
    color: '#666',
    width: 45, // Birim için sabit genişlik
    fontSize: 14,
  },
});

export default SliderItem;
