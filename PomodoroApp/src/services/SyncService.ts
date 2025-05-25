import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { auth } from '../constants/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

interface SyncData {
  tasks: any[];
  pomodoro_sessions: any[];
  ai_analysis: any[];
  notes: any[];
  note_folders: any[];
  badges: any[];
  user_badges: any[];
  user_profile: any[];
  lastSyncedAt: Date;
}

export class SyncService {
  private static db: SQLite.SQLiteDatabase | null = null;

  private static async getDatabase() {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('pomodoro.db');
    }
    return this.db;
  }

  static async syncDataToCloud(): Promise<boolean> {
    try {
      console.log('☁️ Firestore senkronizasyonu başlıyor...');
      
      if (!auth.currentUser) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      console.log('📊 SQLite veriler toplanıyor...');
      const localData = await this.getLocalData();
      
      console.log('📤 Firestore\'a yükleniyor...');
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      
      await setDoc(userDocRef, {
        syncData: localData,
        lastSyncedAt: new Date()
      }, { merge: true });

      await this.setLastSyncDate(new Date());
      console.log('✅ Senkronizasyon başarılı!');
      return true;

    } catch (error) {
      console.error('❌ Firestore sync hatası:', error);
      return false;
    }
  }

  static async syncDataFromCloud(): Promise<boolean> {
    try {
      console.log('☁️ Firestore\'dan indiriliyor...');
      
      if (!auth.currentUser) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists() || !docSnap.data().syncData) {
        console.log('📭 Firestore\'da veri bulunamadı');
        return false;
      }

      const syncData = docSnap.data().syncData as SyncData;
      await this.saveLocalData(syncData);
      await this.setLastSyncDate(new Date());
      
      console.log('✅ İndirme başarılı!');
      return true;

    } catch (error) {
      console.error('❌ Firestore download hatası:', error);
      return false;
    }
  }

  static async clearCloudData(): Promise<boolean> {
    try {
      if (!auth.currentUser) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, {
        syncData: null,
        lastSyncedAt: null
      }, { merge: true });

      await AsyncStorage.removeItem('lastSyncDate');
      console.log('✅ Sync verileri temizlendi');
      return true;

    } catch (error) {
      console.error('❌ Sync veri temizleme hatası:', error);
      return false;
    }
  }

  private static async getLocalData(): Promise<SyncData> {
    try {
      const database = await this.getDatabase();

      // Tüm tabloları sırayla al
      const tasks = await database.getAllAsync('SELECT * FROM tasks');
      const pomodoro_sessions = await database.getAllAsync('SELECT * FROM pomodoro_sessions');
      const ai_analysis = await database.getAllAsync('SELECT * FROM ai_analysis');
      const notes = await database.getAllAsync('SELECT * FROM notes');
      const note_folders = await database.getAllAsync('SELECT * FROM note_folders');
      const badges = await database.getAllAsync('SELECT * FROM badges');
      const user_badges = await database.getAllAsync('SELECT * FROM user_badges');
      const user_profile = await database.getAllAsync('SELECT * FROM user_profile');

      console.log('📊 Toplanan veriler:', {
        tasks: tasks.length,
        pomodoro_sessions: pomodoro_sessions.length,
        ai_analysis: ai_analysis.length,
        notes: notes.length,
        note_folders: note_folders.length,
        badges: badges.length,
        user_badges: user_badges.length,
        user_profile: user_profile.length
      });

      return {
        tasks,
        pomodoro_sessions,
        ai_analysis,
        notes,
        note_folders,
        badges,
        user_badges,
        user_profile,
        lastSyncedAt: new Date()
      };

    } catch (error) {
      console.error('❌ SQLite veri toplama hatası:', error);
      throw new Error(`Yerel veriler alınamadı: ${error}`);
    }
  }

  private static async saveLocalData(syncData: SyncData): Promise<void> {
    try {
      const database = await this.getDatabase();

      await database.withTransactionAsync(async () => {
        // Tasks
        await database.runAsync('DELETE FROM tasks');
        for (const item of syncData.tasks) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO tasks (${columns}) VALUES (${placeholders})`, ...values);
        }

        // Pomodoro Sessions
        await database.runAsync('DELETE FROM pomodoro_sessions');
        for (const item of syncData.pomodoro_sessions) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO pomodoro_sessions (${columns}) VALUES (${placeholders})`, ...values);
        }

        // AI Analysis
        await database.runAsync('DELETE FROM ai_analysis');
        for (const item of syncData.ai_analysis) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO ai_analysis (${columns}) VALUES (${placeholders})`, ...values);
        }

        // Notes
        await database.runAsync('DELETE FROM notes');
        for (const item of syncData.notes) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO notes (${columns}) VALUES (${placeholders})`, ...values);
        }

        // Note Folders
        await database.runAsync('DELETE FROM note_folders');
        for (const item of syncData.note_folders) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO note_folders (${columns}) VALUES (${placeholders})`, ...values);
        }

        // Badges
        await database.runAsync('DELETE FROM badges');
        for (const item of syncData.badges) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO badges (${columns}) VALUES (${placeholders})`, ...values);
        }

        // User Badges
        await database.runAsync('DELETE FROM user_badges');
        for (const item of syncData.user_badges) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO user_badges (${columns}) VALUES (${placeholders})`, ...values);
        }

        // User Profile
        await database.runAsync('DELETE FROM user_profile');
        for (const item of syncData.user_profile) {
          const columns = Object.keys(item).join(', ');
          const placeholders = Object.keys(item).map(() => '?').join(', ');
          const values = Object.values(item) as any[];
          await database.runAsync(`INSERT INTO user_profile (${columns}) VALUES (${placeholders})`, ...values);
        }
      });

      console.log('✅ Tüm veriler yerel veritabanına kaydedildi');

    } catch (error) {
      console.error('❌ Yerel veri kaydetme hatası:', error);
      throw error;
    }
  }

  static async getLastSyncDate(): Promise<Date | null> {
    try {
      const dateString = await AsyncStorage.getItem('lastSyncDate');
      return dateString ? new Date(dateString) : null;
    } catch (error) {
      console.error('Son sync tarihi alınamadı:', error);
      return null;
    }
  }

  static async setLastSyncDate(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem('lastSyncDate', date.toISOString());
    } catch (error) {
      console.error('Son sync tarihi kaydedilemedi:', error);
    }
  }
}
