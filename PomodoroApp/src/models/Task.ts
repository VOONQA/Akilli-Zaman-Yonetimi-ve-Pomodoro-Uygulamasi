export interface Task {
  id: string;
  title: string;
  description?: string;
  date: Date;
  dueDate?: Date;
  isCompleted: boolean;
  pomodoroCount: number;
  completedPomodoros: number;
  totalFocusTime: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Yeni bir Task oluşturmak için kullanılacak temel nesne
export interface CreateTaskDTO {
  title: string;
  description?: string;
  date: Date;
  dueDate?: Date;
  pomodoroCount: number;
  totalFocusTime?: number;
  tags?: string[];
}

// Takvim görünümü için görev özeti
export interface TaskCalendarItem {
  id: string;
  title: string;
  isCompleted: boolean;
  date: Date;
}
