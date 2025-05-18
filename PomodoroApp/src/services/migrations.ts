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

// Rozet tablosu - sistem tarafından tanımlanan mümkün olan tüm rozetler
const CREATE_BADGES_TABLE = `
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  thresholds TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
`;

// Kullanıcının kazandığı rozetler tablosu
const CREATE_USER_BADGES_TABLE = `
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  badge_id TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  earned_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (badge_id) REFERENCES badges (id) ON DELETE CASCADE
)
`;

// Kullanıcı profil bilgileri tablosu
const CREATE_USER_PROFILE_TABLE = `
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  total_focus_time INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  task_completion_rate REAL DEFAULT 0,
  total_pomodoro_completed INTEGER DEFAULT 0,
  perfect_pomodoro_count INTEGER DEFAULT 0,
  most_productive_day TEXT,
  most_productive_time TEXT,
  daily_focus_goal INTEGER DEFAULT 120,
  weekly_task_goal INTEGER DEFAULT 15,
  days_streak INTEGER DEFAULT 0,
  last_active_date TEXT NOT NULL,
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
    
    // Pomodoro oturumları tablosunu oluştur
    await database.execute(CREATE_POMODORO_SESSIONS_TABLE);
    
    // Yapay zeka analiz tablosunu oluştur
    await database.execute(CREATE_AI_ANALYSIS_TABLE);
    
    // Not sisteminin tablolarını oluştur
    await database.execute(CREATE_NOTES_TABLE);
    await database.execute(CREATE_NOTE_FOLDERS_TABLE);
    
    // Rozet ve profil tablolarını oluştur
    await database.execute(CREATE_BADGES_TABLE);
    await database.execute(CREATE_USER_BADGES_TABLE);
    await database.execute(CREATE_USER_PROFILE_TABLE);
    
    console.log('Veritabanı tabloları başarıyla oluşturuldu');
  } catch (error) {
    console.error('Veritabanı tabloları oluşturulurken hata:', error);
    throw error;
  }
};

// Veritabanı versiyonunu kontrol etme ve güncelleme
export const migrateDatabase = async (database: Database): Promise<void> => {
  try {
    // Tabloları oluştur
    await initializeDatabase(database);
  } catch (error) {
    console.error('Veritabanı migrasyonu sırasında hata:', error);
    throw error;
  }
};
