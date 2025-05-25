import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { SyncService } from '../../services/SyncService';
import { EmailVerificationService } from '../../services/EmailVerificationService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useDatabase } from '../../context/DatabaseContext';
import { AutoSyncService } from '../../services/AutoSyncService';
import { ProfileImageService } from '../../services/ProfileImageService';

type AccountSettingsNavigationProp = StackNavigationProp<RootStackParamList, 'AccountSettings'>;

const AccountSettingsScreen: React.FC = () => {
  const { user, logout, profileImage, updateProfileImage } = useAuth();
  const { db } = useDatabase();
  const navigation = useNavigation<AccountSettingsNavigationProp>();
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [nextSyncDate, setNextSyncDate] = useState<Date | null>(null);

  useEffect(() => {
    loadLastSyncDate();
    loadSyncSettings();
  }, []);

  const loadLastSyncDate = async () => {
    try {
      const date = await SyncService.getLastSyncDate();
      setLastSyncDate(date);
    } catch (error) {
      console.error('Son senkronizasyon tarihi yüklenemedi:', error);
    }
  };

  const loadSyncSettings = async () => {
    try {
      const enabled = await AutoSyncService.isAutoSyncEnabled();
      setAutoSyncEnabled(enabled);
      
      if (enabled) {
        const nextSync = await AutoSyncService.getNextSyncDate();
        setNextSyncDate(nextSync);
      }
    } catch (error) {
      console.error('Sync ayarları yüklenemedi:', error);
    }
  };

  const handleManualSync = async () => {
    setSyncLoading(true);
    try {
      await SyncService.syncDataToCloud();
      await loadLastSyncDate();
      Alert.alert('Başarılı', 'Verileriniz buluta senkronize edildi');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    Alert.alert(
      'Bulut Verilerini İndir',
      'Bu işlem mevcut yerel verilerinizi buluttaki verilerle değiştirecek. Devam etmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'İndir',
          onPress: async () => {
            setSyncLoading(true);
            try {
              await SyncService.syncDataFromCloud();
              await loadLastSyncDate();
              Alert.alert('Başarılı', 'Bulut verileri indirildi ve yerel veritabanına kaydedildi');
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            } finally {
              setSyncLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearCloudData = () => {
    Alert.alert(
      'Verileri Temizle',
      'Buluttaki tüm verileriniz silinecek. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await SyncService.clearCloudData();
              setLastSyncDate(null);
              Alert.alert('Başarılı', 'Bulut verileri temizlendi');
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  const goBack = () => {
    navigation.goBack();
  };

  const handleEmailVerification = async () => {
    if (!user?.email) {
      Alert.alert('Hata', 'E-posta adresi bulunamadı');
      return;
    }

    try {
      await EmailVerificationService.sendVerificationCode(user.email);
      navigation.navigate('EmailVerification', { email: user.email });
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    try {
      setAutoSyncEnabled(enabled);
      await AutoSyncService.setAutoSyncEnabled(enabled);
      
      if (enabled) {
        const nextSync = await AutoSyncService.getNextSyncDate();
        setNextSyncDate(nextSync);
        Alert.alert('Başarılı', 'Haftalık otomatik senkronizasyon aktif edildi');
      } else {
        setNextSyncDate(null);
        Alert.alert('Başarılı', 'Otomatik senkronizasyon devre dışı bırakıldı');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
      setAutoSyncEnabled(!enabled); // Geri al
    }
  };

  const handleProfileImagePress = async () => {
    Alert.alert(
      'Profil Resmi',
      'Ne yapmak istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Resim Seç', onPress: selectNewImage },
        ...(profileImage ? [{ text: 'Resmi Sil', style: 'destructive' as const, onPress: removeImage }] : [])
      ]
    );
  };

  const selectNewImage = async () => {
    try {
      const imageUri = await ProfileImageService.selectProfileImage();
      if (imageUri) {
        await updateProfileImage(imageUri);
        Alert.alert('Başarılı', 'Profil resminiz güncellendi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Profil resmi güncellenirken bir hata oluştu');
    }
  };

  const removeImage = async () => {
    try {
      await updateProfileImage(null);
      Alert.alert('Başarılı', 'Profil resminiz silindi');
    } catch (error) {
      Alert.alert('Hata', 'Profil resmi silinirken bir hata oluştu');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Hesap Ayarları</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Kullanıcı Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.userAvatar}
              onPress={handleProfileImagePress}
              activeOpacity={0.7}
            >
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.userAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={32} color="#4a6da7" />
              )}
              
              <View style={styles.avatarEditIcon}>
                <Ionicons name="camera" size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user?.displayName || 'Pomodoro Kullanıcısı'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.verificationContainer}>
                <Text style={styles.userStatus}>
                  {user?.emailVerified ? '✅ Doğrulanmış' : '❌ Doğrulanmamış'}
                </Text>
                {!user?.emailVerified && (
                  <TouchableOpacity 
                    style={styles.verifyButton} 
                    onPress={handleEmailVerification}
                  >
                    <Text style={styles.verifyButtonText}>Hesabını Doğrula</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Senkronizasyon Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Senkronizasyon</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Otomatik Senkronizasyon</Text>
              <Text style={styles.settingDescription}>
                Haftalık otomatik veri senkronizasyonu
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={handleAutoSyncToggle}
              trackColor={{ false: '#e1e5e9', true: '#4a6da7' }}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, syncLoading && styles.buttonDisabled]} 
            onPress={handleManualSync}
            disabled={syncLoading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#4a6da7" />
            <Text style={styles.buttonText}>
              {syncLoading ? 'Yükleniyor...' : 'Buluta Yükle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, syncLoading && styles.buttonDisabled]} 
            onPress={handleDownloadFromCloud}
            disabled={syncLoading}
          >
            <Ionicons name="cloud-download-outline" size={20} color="#4a6da7" />
            <Text style={styles.buttonText}>
              {syncLoading ? 'İndiriliyor...' : 'Buluttan İndir'}
            </Text>
          </TouchableOpacity>

          {lastSyncDate && (
            <Text style={styles.lastSync}>
              Son senkronizasyon: {format(lastSyncDate, 'dd MMMM yyyy, HH:mm', { locale: tr })}
            </Text>
          )}

          {nextSyncDate && autoSyncEnabled && (
            <Text style={styles.nextSync}>
              Sonraki otomatik senkronizasyon: {format(nextSyncDate, 'dd MMMM yyyy, HH:mm', { locale: tr })}
            </Text>
          )}
        </View>

        {/* Veri Yönetimi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearCloudData}>
            <Ionicons name="cloud-offline-outline" size={20} color="#e74c3c" />
            <Text style={styles.dangerButtonText}>Bulut Verilerini Temizle</Text>
          </TouchableOpacity>
        </View>

        {/* Hesap İşlemleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap İşlemleri</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
            <Text style={styles.dangerButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
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
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 12,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    color: '#4a6da7',
    fontWeight: '500',
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
    marginLeft: 8,
  },
  lastSync: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  verificationContainer: {
    marginTop: 8,
  },
  verifyButton: {
    backgroundColor: '#4a6da7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  nextSync: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default AccountSettingsScreen;
