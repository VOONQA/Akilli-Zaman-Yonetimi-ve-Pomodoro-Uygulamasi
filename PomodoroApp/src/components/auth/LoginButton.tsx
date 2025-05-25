import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface LoginButtonProps {
  onPress: () => void;
  style?: any;
}

const LoginButton: React.FC<LoginButtonProps> = ({ onPress, style }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isAuthenticated ? "settings-outline" : "log-in-outline"} 
        size={16} 
        color="#4a6da7" 
      />
      <Text style={styles.text}>
        {isAuthenticated ? 'Hesap Ayarları' : 'Giriş Yap'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  text: {
    fontSize: 13,
    color: '#4a6da7',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default LoginButton;
