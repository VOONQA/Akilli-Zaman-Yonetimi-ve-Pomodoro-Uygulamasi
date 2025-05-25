import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { EmailVerificationService } from '../../services/EmailVerificationService';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/AuthService';

interface RouteParams {
  email: string;
}

type EmailVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'EmailVerification'>;

const EmailVerificationScreen: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigation = useNavigation<EmailVerificationNavigationProp>();
  const route = useRoute();
  const { email } = route.params as RouteParams;
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Hata', 'Lütfen doğrulama kodunu girin');
      return;
    }

    if (code.length !== 5) {
      Alert.alert('Hata', 'Doğrulama kodu 5 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      const isValid = await EmailVerificationService.verifyCode(email, code);
      
      if (isValid && user) {
        await AuthService.markEmailAsVerified(user.uid);
        
        await refreshUser();

        Alert.alert(
          'Başarılı',
          'E-posta adresiniz doğrulandı!',
          [
            {
              text: 'Tamam',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ 
                    name: 'MainTabs',
                    params: { screen: 'Settings' } 
                  }],
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      await EmailVerificationService.sendVerificationCode(email);
      setCountdown(60);
      Alert.alert('Başarılı', 'Doğrulama kodu tekrar gönderildi');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>E-posta Doğrulama</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={64} color="#4a6da7" />
        </View>

        <Text style={styles.description}>
          {email} adresine gönderilen 5 haneli doğrulama kodunu girin.
        </Text>

        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="Doğrulama Kodu"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            maxLength={5}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType="default"
            textAlign="center"
          />
        </View>

        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]} 
          onPress={handleVerifyCode}
          disabled={loading}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.resendButton, 
            (resendLoading || countdown > 0) && styles.resendButtonDisabled
          ]} 
          onPress={handleResendCode}
          disabled={resendLoading || countdown > 0}
        >
          <Text style={styles.resendButtonText}>
            {resendLoading 
              ? 'Gönderiliyor...' 
              : countdown > 0 
                ? `Tekrar gönder (${countdown}s)`
                : 'Kodu Tekrar Gönder'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 60,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: '#4a6da7',
    color: '#333',
  },
  verifyButton: {
    backgroundColor: '#4a6da7',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    color: '#4a6da7',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EmailVerificationScreen; 