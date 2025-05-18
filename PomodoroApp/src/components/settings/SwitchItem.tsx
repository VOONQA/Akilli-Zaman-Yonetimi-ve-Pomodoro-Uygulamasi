import React from 'react';
import { Switch, StyleSheet, Text, View } from 'react-native';
import SettingsItem from './SettingsItem';

interface SwitchItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SwitchItem: React.FC<SwitchItemProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  value,
  onValueChange,
}) => {
  return (
    <SettingsItem
      title={title}
      subtitle={
        <View>
          <Text 
            style={styles.subtitle} 
            numberOfLines={3}
          >
            {subtitle}
          </Text>
        </View>
      }
      icon={icon}
      iconColor={iconColor}
      rightComponent={
        <Switch
          style={styles.switch}
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e0e0e0', true: '#4a6da7' }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  }
});

export default SwitchItem;
