import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../constants/firebaseConfig';

export class ProfileImageService {
  private static PROFILE_IMAGE_KEY = 'profileImage';

  // Galeri veya kameradan resim seç
  static async selectProfileImage(): Promise<string | null> {
    try {
      // İzin kontrolü
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor');
        return null;
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Profil Resmi Seç',
          'Resmi nereden seçmek istiyorsunuz?',
          [
            { text: 'İptal', style: 'cancel', onPress: () => resolve(null) },
            { text: 'Galeri', onPress: async () => {
              const result = await this.pickFromGallery();
              resolve(result);
            }},
            { text: 'Kamera', onPress: async () => {
              const result = await this.pickFromCamera();
              resolve(result);
            }}
          ]
        );
      });
    } catch (error) {
      console.error('Resim seçme hatası:', error);
      return null;
    }
  }

  // Galeriden resim seç
  private static async pickFromGallery(): Promise<string | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kare format
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Galeri resim seçme hatası:', error);
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu');
      return null;
    }
  }

  // Kameradan resim çek
  private static async pickFromCamera(): Promise<string | null> {
    try {
      // Kamera izni
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Kare format
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Kamera resim çekme hatası:', error);
      Alert.alert('Hata', 'Resim çekilirken bir hata oluştu');
      return null;
    }
  }

  // Profil resmini kaydet
  private static async saveProfileImage(imageUri: string): Promise<void> {
    try {
      // Local storage'a kaydet
      await AsyncStorage.setItem(this.PROFILE_IMAGE_KEY, imageUri);

      // Firestore'a da kaydet
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          profileImageUri: imageUri,
          updatedAt: new Date()
        });
      }

      console.log('✅ Profil resmi kaydedildi');
    } catch (error) {
      console.error('❌ Profil resmi kaydetme hatası:', error);
      throw error;
    }
  }

  // Profil resmini al
  static async getProfileImage(): Promise<string | null> {
    try {
      const imageUri = await AsyncStorage.getItem(this.PROFILE_IMAGE_KEY);
      return imageUri;
    } catch (error) {
      console.error('Profil resmi alma hatası:', error);
      return null;
    }
  }

  // Profil resmini sil
  static async removeProfileImage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PROFILE_IMAGE_KEY);

      // Firestore'dan da sil
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          profileImageUri: null,
          updatedAt: new Date()
        });
      }

      console.log('✅ Profil resmi silindi');
    } catch (error) {
      console.error('❌ Profil resmi silme hatası:', error);
      throw error;
    }
  }
} 