import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncService } from './SyncService';
import { auth } from '../constants/firebaseConfig';

export class AutoSyncService {
  private static SYNC_INTERVAL_KEY = 'autoSyncInterval';
  private static LAST_AUTO_SYNC_KEY = 'lastAutoSync';
  private static AUTO_SYNC_ENABLED_KEY = 'autoSyncEnabled';
  
  // Haftalık senkronizasyon (7 gün = 604800000 ms)
  private static WEEKLY_INTERVAL = 7 * 24 * 60 * 60 * 1000;

  // Otomatik senkronizasyonu başlat
  static async startAutoSync(): Promise<void> {
    try {
      const isEnabled = await this.isAutoSyncEnabled();
      if (!isEnabled) return;

      console.log('🔄 Otomatik senkronizasyon başlatılıyor...');
      
      // Mevcut interval'ı temizle
      await this.stopAutoSync();
      
      // Yeni interval başlat
      const intervalId = setInterval(async () => {
        await this.performAutoSync();
      }, this.WEEKLY_INTERVAL);
      
      // Interval ID'sini kaydet
      await AsyncStorage.setItem(this.SYNC_INTERVAL_KEY, intervalId.toString());
      
      console.log('✅ Haftalık otomatik senkronizasyon aktif');
    } catch (error) {
      console.error('❌ Otomatik senkronizasyon başlatma hatası:', error);
    }
  }

  // Otomatik senkronizasyonu durdur
  static async stopAutoSync(): Promise<void> {
    try {
      const intervalId = await AsyncStorage.getItem(this.SYNC_INTERVAL_KEY);
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        await AsyncStorage.removeItem(this.SYNC_INTERVAL_KEY);
        console.log('🛑 Otomatik senkronizasyon durduruldu');
      }
    } catch (error) {
      console.error('❌ Otomatik senkronizasyon durdurma hatası:', error);
    }
  }

  // Otomatik senkronizasyon durumunu kontrol et
  static async isAutoSyncEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(this.AUTO_SYNC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      return false;
    }
  }

  // Otomatik senkronizasyon durumunu ayarla
  static async setAutoSyncEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTO_SYNC_ENABLED_KEY, enabled.toString());
      
      if (enabled) {
        await this.startAutoSync();
      } else {
        await this.stopAutoSync();
      }
    } catch (error) {
      console.error('❌ Otomatik senkronizasyon ayarlama hatası:', error);
    }
  }

  // Senkronizasyon işlemini gerçekleştir
  private static async performAutoSync(): Promise<void> {
    try {
      // Kullanıcı giriş yapmış mı kontrol et
      if (!auth.currentUser) {
        console.log('⚠️ Kullanıcı giriş yapmamış, otomatik senkronizasyon atlanıyor');
        return;
      }

      console.log('🔄 Haftalık otomatik senkronizasyon başlıyor...');
      
      // Son otomatik senkronizasyon tarihini kontrol et
      const lastSync = await this.getLastAutoSyncDate();
      const now = new Date();
      
      // Eğer son senkronizasyondan 7 gün geçmemişse atla
      if (lastSync && (now.getTime() - lastSync.getTime()) < this.WEEKLY_INTERVAL) {
        console.log('⏰ Henüz haftalık süre dolmadı, senkronizasyon atlanıyor');
        return;
      }

      // Senkronizasyonu gerçekleştir
      const success = await SyncService.syncDataToCloud();
      
      if (success) {
        await this.setLastAutoSyncDate(now);
        console.log('✅ Haftalık otomatik senkronizasyon tamamlandı');
      } else {
        console.log('❌ Haftalık otomatik senkronizasyon başarısız');
      }
      
    } catch (error) {
      console.error('❌ Otomatik senkronizasyon hatası:', error);
    }
  }

  // Son otomatik senkronizasyon tarihini al
  private static async getLastAutoSyncDate(): Promise<Date | null> {
    try {
      const dateString = await AsyncStorage.getItem(this.LAST_AUTO_SYNC_KEY);
      return dateString ? new Date(dateString) : null;
    } catch (error) {
      return null;
    }
  }

  // Son otomatik senkronizasyon tarihini kaydet
  private static async setLastAutoSyncDate(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_AUTO_SYNC_KEY, date.toISOString());
    } catch (error) {
      console.error('❌ Son otomatik senkronizasyon tarihi kaydedilemedi:', error);
    }
  }

  // Bir sonraki senkronizasyon tarihini al
  static async getNextSyncDate(): Promise<Date | null> {
    try {
      const lastSync = await this.getLastAutoSyncDate();
      if (!lastSync) return null;
      
      const nextSync = new Date(lastSync.getTime() + this.WEEKLY_INTERVAL);
      return nextSync;
    } catch (error) {
      return null;
    }
  }
} 