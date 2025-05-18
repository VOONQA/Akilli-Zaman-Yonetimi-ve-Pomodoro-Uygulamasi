import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsItem from './SettingsItem';

interface SelectOption {
  label: string;
  value: string;
  icon?: string;
}

interface SelectItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
}

const SelectItem: React.FC<SelectItemProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  options,
  value,
  onValueChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const renderOption = ({ item }: { item: SelectOption }) => {
    const isSelected = item.value === value;
    
    return (
      <TouchableOpacity
        style={[styles.optionItem, isSelected && styles.selectedOption]}
        onPress={() => {
          onValueChange(item.value);
          setModalVisible(false);
        }}
      >
        {item.icon && (
          <Ionicons name={item.icon as any} size={20} color={isSelected ? '#4a6da7' : '#666'} style={styles.optionIcon} />
        )}
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="#4a6da7" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SettingsItem
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconColor={iconColor}
        rightComponent={
          <View style={styles.selectedValueContainer}>
            <Text style={styles.selectedValue}>{selectedOption?.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        }
        onPress={() => setModalVisible(true)}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectedValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedValue: {
    fontSize: 16,
    color: '#555',
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  selectedOption: {
    backgroundColor: '#f0f5ff',
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#4a6da7',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});

export default SelectItem;
