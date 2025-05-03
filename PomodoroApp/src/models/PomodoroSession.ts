export interface PomodoroSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // saniye cinsinden süre
  taskId?: string;  // İlişkili görev (eğer varsa)
  type: 'pomodoro' | 'shortBreak' | 'longBreak';
  completed: boolean;
  date: string; // YYYY-MM-DD formatında tarih
  timeOfDay: number; // 0-23 arası saat dilimi
  createdAt: Date;
  updatedAt: Date;
}

// Veritabanı formatı için dönüştürme tablosu
export interface PomodoroSessionTable {
  id: string;
  start_time: string; // ISO tarih formatında
  end_time: string;   // ISO tarih formatında 
  duration: number;
  task_id: string | null;
  type: string;
  completed: number; // 0 = false, 1 = true
  date: string;      // YYYY-MM-DD formatında
  time_of_day: number;
  created_at: string; // ISO tarih formatında
  updated_at: string; // ISO tarih formatında
}

// Yeni bir PomodoroSession oluşturmak için kullanılacak DTO
export interface CreatePomodoroSessionDTO {
  startTime: Date;
  endTime: Date;
  duration: number;
  taskId?: string;
  type: 'pomodoro' | 'shortBreak' | 'longBreak';
  completed: boolean;
  date: string;
  timeOfDay: number;
}
