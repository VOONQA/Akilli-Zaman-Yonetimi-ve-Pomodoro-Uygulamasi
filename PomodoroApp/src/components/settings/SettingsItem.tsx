import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SettingsItemProps {
  title: string;
  subtitle: string | React.ReactNode;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  rightComponent?: ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  icon,
  iconColor = '#4a6da7',
  onPress,
  rightComponent,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.leftSection}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon as any} size={22} color={iconColor} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {typeof subtitle === 'string' ? (
            <Text 
              style={styles.subtitle} 
              numberOfLines={3}
            >
              {subtitle}
            </Text>
          ) : subtitle}
        </View>
      </View>
      
      <View style={styles.rightSection}>
        {rightComponent ? (
          rightComponent
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={20} color="#888" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 18,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 45,
    justifyContent: 'flex-end',
    marginLeft: 8,
    alignSelf: 'center',
  },
});

export default SettingsItem;
