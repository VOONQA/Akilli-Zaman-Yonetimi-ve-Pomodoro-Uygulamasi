import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoginButton from '../auth/LoginButton';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ProfileImageService } from '../../services/ProfileImageService';
import { styles } from './styles';

interface ProfileHeaderProps {
  totalFocusTime: number;
  completionRate: number;
  totalBadges: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  totalFocusTime,
  completionRate,
  totalBadges,
}) => {
  const { isAuthenticated, user, profileImage, updateProfileImage } = useAuth();
  const navigation = useNavigation();

  const handleProfileImagePress = async () => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Profil resmi eklemek için giriş yapmanız gerekiyor');
      return;
    }

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

  const handleLoginPress = () => {
    if (isAuthenticated) {
      navigation.navigate('AccountSettings' as never);
    } else {
      navigation.navigate('Login' as never);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.profileImageContainer}
        onPress={handleProfileImagePress}
        activeOpacity={0.7}
      >
        <View style={styles.profileImage}>
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImagePhoto}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={40} color="#ffffff" />
          )}
          
          {/* Düzenleme ikonu */}
          {isAuthenticated && (
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={16} color="#ffffff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      <Text style={styles.userName}>
        {isAuthenticated && user?.displayName ? user.displayName : 'Pomodoro Kullanıcısı'}
      </Text>
      
      <LoginButton onPress={handleLoginPress} />
      
      <View style={styles.badgeCountContainer}>
        <Ionicons name="ribbon" size={18} color="#4a6da7" />
        <Text style={styles.badgeCountText}>{totalBadges} Rozet Kazanıldı</Text>
      </View>
    </View>
  );
};

export default ProfileHeader;
