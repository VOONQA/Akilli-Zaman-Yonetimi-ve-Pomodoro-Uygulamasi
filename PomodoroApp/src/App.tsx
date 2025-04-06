import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './navigation/AppNavigator';
import { useDatabase } from './context/DatabaseContext';
import LoadingScreen from './components/common/LoadingScreen';
import { checkApiKey } from './services/chatbot/checkEnv';
///
// Geçici olarak burada tanımlıyoruz, aslında services/database.ts'de olacak
const initializeTables = async (db: any) => {
  console.log('Tablolar başlatılıyor...');
  // Burada tablo oluşturma işlemleri olacak
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
      }
    };

    // API Key'i kontrol et
    checkApiKey();

    setupDatabase();
    
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

export default MainApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});