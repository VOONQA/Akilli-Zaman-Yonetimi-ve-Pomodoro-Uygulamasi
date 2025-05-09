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
  total_focus_time INTEGER DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
`;

// Pomodoro oturumlarını saklayacak tablo
const CREATE_POMODORO_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER NOT NULL,
  task_id TEXT,
  type TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  time_of_day INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
)
`;

// Yapay zeka analizlerini saklayacak tablo
const CREATE_AI_ANALYSIS_TABLE = `
CREATE TABLE IF NOT EXISTS ai_analysis (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  period_type TEXT NOT NULL, 
  period_value TEXT NOT NULL,
  analysis_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
`;

// Not tablolarını oluşturma sorguları
const CREATE_NOTES_TABLE = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  folder_id TEXT,
  color TEXT
)
`;

const CREATE_NOTE_FOLDERS_TABLE = `
CREATE TABLE IF NOT EXISTS note_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  color TEXT
)
`;

// Veritabanı tablosu oluşturma
export const initializeDatabase = async (database: Database): Promise<void> => {
  try {
    console.log('Veritabanı tabloları oluşturuluyor...');
    
    // Tasks tablosunu oluştur
    await database.execute(CREATE_TASKS_TABLE);
    
    // Pomodoro oturumları tablosunu oluştur
    await database.execute(CREATE_POMODORO_SESSIONS_TABLE);
    
    // Yapay zeka analiz tablosunu oluştur
    await database.execute(CREATE_AI_ANALYSIS_TABLE);
    
    // Not sisteminin tablolarını oluştur
    await database.execute(CREATE_NOTES_TABLE);
    await database.execute(CREATE_NOTE_FOLDERS_TABLE);
    
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
