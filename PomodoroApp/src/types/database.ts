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
  execute: (query: string, params?: any[]) => Promise<DbResult>;
  select: <T>(query: string, params?: any[]) => Promise<T[]>;
  insert: (table: string, data: Record<string, any>) => Promise<number>;
  update: (table: string, data: Record<string, any>, where: string, params?: any[]) => Promise<number>;
  delete: (table: string, where: string, params?: any[]) => Promise<number>;
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
  tags: string | null; // JSON formatında array
  created_at: string; // ISO tarih formatında
  updated_at: string; // ISO tarih formatında
}
