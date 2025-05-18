import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { AppNavigator } from './navigation/AppNavigator';
import { useDatabase } from './context/DatabaseContext';
import LoadingScreen from './components/common/LoadingScreen';
import { checkApiKey } from './services/chatbot/checkEnv';
import { initDatabase } from './services/database';
import { initializeBadgesInDB, ensureDefaultUserProfile } from './services/BadgeService';
import * as Notifications from 'expo-notifications';
import { useTask } from './context/TaskContext';
import { migrateDatabase } from './services/migrations';
///
// Geçici olarak burada tanımlıyoruz, aslında services/database.ts'de olacak
const initializeTables = async (db: any) => {
  console.log('Tablolar başlatılıyor...');
  
  try {
    // Migrasyon işlemini çağır - bu hem tabloları oluşturur hem de gerekirse ALTER TABLE yapar
    await migrateDatabase(db);
    console.log('Veritabanı migrasyonu başarıyla tamamlandı');
  } catch (error) {
    console.error('Veritabanı migrasyonu sırasında hata:', error);
  }
  
  return Promise.resolve();
};

const MainApp: React.FC = () => {
  const { db, isLoading, initializeDatabase } = useDatabase();

  // Veritabanını başlat ve tabloları oluştur - sadece bir kez çalışacak
  useEffect(() => {
    console.log('useEffect çalıştı');
    
    const setupDatabase = async () => {
      console.log('setupDatabase fonksiyonu çalıştı');
      await initializeDatabase();
      
      // db varsa tabloları oluştur
      if (db) {
        await initializeTables(db);
        // Rozet verilerini yükle
        await initializeBadgesInDB(db);
        // Varsayılan kullanıcı profilini oluştur
        await ensureDefaultUserProfile(db);
      }
    };

    // API Key'i kontrol et
    checkApiKey();

    initDatabase().catch(console.error);

    setupDatabase();
    
    // Bildirim sistemini kur (timer bildirimleri için gerekli)
    setupNotifications();
    
    // Temizleme fonksiyonu - komponent kaldırıldığında çalışır
    return () => {
      console.log('Temizleme işlemi yapılıyor...');
    };
  }, []); // Boş dizi - sadece bir kez çalışacak

  console.log('isLoading:', isLoading);

  // Veritabanı yüklenirken bekleme ekranı göster
  if (isLoading) {
    return <LoadingScreen />;
  }

  return <AppNavigator />;
};

const setupNotifications = async () => {
  // Android için bildirim kanalı oluştur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('timer-channel', {
      name: 'Timer Bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true, // Varsayılan olarak titreşim açık
      sound: 'bell.wav' // Özel ses dosyası
    });
  }
  
  // Bildirim izinlerini kontrol et
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
  
  // Bildirim işleyici ayarla
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
};

export default MainApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});