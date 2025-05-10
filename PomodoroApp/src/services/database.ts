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

// Singleton veritabanı örneği
let dbInstance: any = null;

// Veritabanını aç
export function openDatabase(): Database {
  try {
    if (dbInstance) {
      return createDatabaseInterface(dbInstance);
    }
    
    // Web platformu kontrolü
    if (Platform.OS === 'web') {
      console.warn('SQLite web platformunda tam desteklenmiyor, bazı işlevler çalışmayabilir');
      return createEmptyDatabaseInterface();
    }
    
    // Yeni API'yi kullan
    dbInstance = SQLite.openDatabaseSync(DATABASE_NAME);
    console.log('Veritabanı başarıyla açıldı');
    
    return createDatabaseInterface(dbInstance);
  } catch (error) {
    console.error('Veritabanı açılırken hata:', error);
    return createEmptyDatabaseInterface();
  }
}

// Boş veritabanı arayüzü - hata durumunda
function createEmptyDatabaseInterface(): Database {
  return {
    execute: async () => ({ insertId: 0, rowsAffected: 0, rows: [] }),
    select: async <T>() => [] as T[],
    insert: async () => 0,
    update: async () => 0,
    delete: async () => 0
  };
}

// Modern veritabanı arayüzü
function createDatabaseInterface(db: any): Database {
  return {
    // Genel sorgu çalıştırma
    execute: async (query: string, params: any[] = []): Promise<DbResult> => {
      try {
        // Yeni API kullan - runAsync
        const result = await db.runAsync(query, params).catch((error: any) => {
          console.error("Query error:", query, error);
          return { lastInsertRowId: 0, changes: 0 };
        });
        
        return {
          insertId: result.lastInsertRowId || 0,
          rowsAffected: result.changes || 0,
          rows: []
        };
      } catch (err) {
        console.error("Fatal query error:", query, err);
        return { insertId: 0, rowsAffected: 0, rows: [] };
      }
    },
    
    // SELECT sorgusu
    select: async <T>(query: string, params: any[] = []): Promise<T[]> => {
      try {
        // Yeni API kullan - getAllAsync (jenerik tip argümanı olmadan)
        const rows = await db.getAllAsync(query, params).catch((error: any) => {
          console.error("Select error:", query, error);
          return [];
        });
        
        // Tip dönüşümünü burada yapalım
        return (rows || []) as T[];
      } catch (err) {
        console.error("Fatal select error:", query, err);
        return [] as T[];
      }
    },
    
    // INSERT sorgusu
    insert: async (table: string, data: Record<string, any>): Promise<number> => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(',');
      
      const query = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
      
      try {
        const result = await db.runAsync(query, values).catch((error: any) => {
          console.error("Insert error:", query, error);
          return { lastInsertRowId: 0 };
        });
        
        return result.lastInsertRowId || 0;
      } catch (err) {
        console.error("Fatal insert error:", query, err);
        return 0;
      }
    },
    
    // UPDATE sorgusu
    update: async (
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
      
      try {
        const result = await db.runAsync(query, values).catch((error: any) => {
          console.error("Update error:", query, error);
          return { changes: 0 };
        });
        
        return result.changes || 0;
      } catch (err) {
        console.error("Fatal update error:", query, err);
        return 0;
      }
    },
    
    // DELETE sorgusu
    delete: async (
      table: string, 
      where: string, 
      params: any[] = []
    ): Promise<number> => {
      const query = `DELETE FROM ${table} WHERE ${where}`;
      
      try {
        const result = await db.runAsync(query, params).catch((error: any) => {
          console.error("Delete error:", query, error);
          return { changes: 0 };
        });
        
        return result.changes || 0;
      } catch (err) {
        console.error("Fatal delete error:", query, err);
        return 0;
      }
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
  }
};