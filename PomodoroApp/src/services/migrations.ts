import { Database } from '../types/database';

// Tablo oluşturma sorguları
const CREATE_TASKS_TABLE = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  due_date TEXT,
  is_completed INTEGER DEFAULT 0,
  pomodoro_count INTEGER DEFAULT 1,
  completed_pomodoros INTEGER DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
`;

// Veritabanı tablosu oluşturma
export const initializeDatabase = async (database: Database): Promise<void> => {
  try {
    console.log('Veritabanı tabloları oluşturuluyor...');
    
    // Tasks tablosunu oluştur
    await database.execute(CREATE_TASKS_TABLE);
    
    console.log('Veritabanı tabloları başarıyla oluşturuldu');
  } catch (error) {
    console.error('Veritabanı tabloları oluşturulurken hata:', error);
    throw error;
  }
};

// Veritabanı versiyonunu kontrol etme ve güncelleme
export const migrateDatabase = async (database: Database): Promise<void> => {
  try {
    // Şu anda basit bir yapılandırma, gelecekte migration yapısı eklenebilir
    await initializeDatabase(database);
  } catch (error) {
    console.error('Veritabanı migrasyonu sırasında hata:', error);
    throw error;
  }
};
