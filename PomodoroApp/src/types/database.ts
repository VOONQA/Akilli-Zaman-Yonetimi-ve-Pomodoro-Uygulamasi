import { SQLiteDatabase } from 'expo-sqlite';

// Temel veritabanı tipleri
interface DbResult {
  insertId?: number;
  rowsAffected?: number;
  rows?: any[];
}

// Veritabanı arayüzü - hem services/database.ts hem de tüm uygulama için ortak
export interface Database {
  _db?: any; // Orijinal SQLite veritabanı nesnesini saklamak için
  execute: (query: string, params?: any[]) => Promise<void>;
  select: <T>(query: string, params?: any[]) => Promise<T[]>;
  insert: (tableName: string, row: Record<string, any>) => Promise<void>;
  update: (tableName: string, row: Record<string, any>, where: string, params?: any[]) => Promise<void>;
  delete: (tableName: string, where: string, params?: any[]) => Promise<void>;
  transaction: <T>(callback: () => Promise<T>) => Promise<T>;
}

// Task tablosu için tip tanımlamaları
export interface TaskTable {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO tarih formatında
  due_date: string | null; // ISO tarih formatında
  is_completed: number; // 0 = false, 1 = true
  pomodoro_count: number;
  completed_pomodoros: number;
  total_focus_time: number; // Eklendi
  tags: string | null; // JSON formatında array
  created_at: string; // ISO tarih formatında
  updated_at: string; // ISO tarih formatında
}

// Pomodoro oturumları tablosu için tip tanımlamaları
export interface PomodoroSessionTable {
  id: string;
  start_time: string; // ISO tarih formatında
  end_time: string; // ISO tarih formatında
  duration: number; // saniye cinsinden
  task_id: string | null;
  type: string; // 'pomodoro', 'shortBreak', 'longBreak'
  completed: number; // 0 = false, 1 = true
  date: string; // YYYY-MM-DD formatında
  time_of_day: number; // 0-23 arası saat dilimi
  created_at: string; // ISO tarih formatında
  updated_at: string; // ISO tarih formatında
}

// Veritabanı tabloları için birleşik tip
export type DatabaseTables = {
  tasks: TaskTable;
  pomodoro_sessions: PomodoroSessionTable;
};
