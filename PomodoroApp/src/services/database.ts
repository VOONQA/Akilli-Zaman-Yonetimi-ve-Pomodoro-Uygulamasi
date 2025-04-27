import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Temel veritabanı tipleri
interface DbResult {
  insertId?: number;
  rowsAffected?: number;
  rows?: any[];
}

// Veritabanı arayüzü
export interface Database {
  execute: (query: string, params?: any[]) => Promise<DbResult>;
  select: <T>(query: string, params?: any[]) => Promise<T[]>;
  insert: (table: string, data: Record<string, any>) => Promise<number>;
  update: (table: string, data: Record<string, any>, where: string, params?: any[]) => Promise<number>;
  delete: (table: string, where: string, params?: any[]) => Promise<number>;
}

// Veritabanı dosyası adı
const DATABASE_NAME = 'pomodoro.db';

// Veritabanını aç
export function openDatabase(): Database {
  // Expo SQLite'ın doğru API'sini kullanalım
  const db = SQLite.openDatabaseSync(DATABASE_NAME);
  
  // Basit wrapper fonksiyonları
  return {
    // Genel sorgu çalıştırma
    execute: (query: string, params: any[] = []): Promise<DbResult> => {
      return new Promise((resolve, reject) => {
        try {
          // Yeni API'yi kullanalım - runAsync
          db.runAsync(query, params)
            .then((result) => {
              resolve({
                insertId: result.lastInsertRowId,
                rowsAffected: result.changes,
                rows: []
              });
            })
            .catch((error) => {
              console.error("Query error:", query, error);
              reject(error);
            });
        } catch (err) {
          console.error("Fatal query error:", query, err);
          reject(err);
        }
      });
    },
    
    // SELECT sorgusu
    select: <T>(query: string, params: any[] = []): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        try {
          // Yeni API'yi kullanalım - getAllAsync
          db.getAllAsync<T>(query, params)
            .then((rows) => {
              resolve(rows);
            })
            .catch((error) => {
              console.error("Select error:", query, error);
              reject(error);
            });
        } catch (err) {
          console.error("Fatal select error:", query, err);
          reject(err);
        }
      });
    },
    
    // INSERT sorgusu
    insert: (table: string, data: Record<string, any>): Promise<number> => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(',');
      
      const query = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
      
      return new Promise((resolve, reject) => {
        try {
          db.runAsync(query, values)
            .then((result) => {
              resolve(result.lastInsertRowId || 0);
            })
            .catch((error) => {
              console.error("Insert error:", query, error);
              reject(error);
            });
        } catch (err) {
          console.error("Fatal insert error:", query, err);
          reject(err);
        }
      });
    },
    
    // UPDATE sorgusu
    update: (
      table: string, 
      data: Record<string, any>, 
      where: string, 
      params: any[] = []
    ): Promise<number> => {
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(',');
      
      const values = [...Object.values(data), ...params];
      const query = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      
      return new Promise((resolve, reject) => {
        try {
          db.runAsync(query, values)
            .then((result) => {
              resolve(result.changes || 0);
            })
            .catch((error) => {
              console.error("Update error:", query, error);
              reject(error);
            });
        } catch (err) {
          console.error("Fatal update error:", query, err);
          reject(err);
        }
      });
    },
    
    // DELETE sorgusu
    delete: (
      table: string, 
      where: string, 
      params: any[] = []
    ): Promise<number> => {
      const query = `DELETE FROM ${table} WHERE ${where}`;
      
      return new Promise((resolve, reject) => {
        try {
          db.runAsync(query, params)
            .then((result) => {
              resolve(result.changes || 0);
            })
            .catch((error) => {
              console.error("Delete error:", query, error);
              reject(error);
            });
        } catch (err) {
          console.error("Fatal delete error:", query, err);
          reject(err);
        }
      });
    }
  };
}

// Veritabanı yolunu kontrol etmek için yardımcı fonksiyon
export const getDatabasePath = (): string => {
  if (Platform.OS === 'web') {
    return DATABASE_NAME;
  }
  
  return `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;
};

// Veritabanı başlatma fonksiyonu
export const initDatabase = async () => {
  const db = openDatabase();
  
  try {
    // Mevcut tabloyu düşür ve yeniden oluştur
    await db.execute(`DROP TABLE IF EXISTS saved_youtube_videos;`);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_youtube_videos (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        channelTitle TEXT NOT NULL,
        channelId TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Veritabanı başarıyla başlatıldı');
  } catch (error) {
    console.error('Veritabanı başlatılırken hata:', error);
    throw error;
  }
};