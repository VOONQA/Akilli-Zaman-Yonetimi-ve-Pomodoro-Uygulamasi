// Günlük istatistikler tipi
export interface DailyStats {
  date: string;
  totalPomodoros: number;
  completedPomodoros: number;
  totalFocusTime: number; // saniye olarak
  tasks: {
    total: number;
    completed: number;
  };
  mostProductiveHour?: number;
}

// Haftalık istatistikler tipi
export interface WeeklyStats {
  startDate: string;
  endDate: string;
  days: DailyStats[];
  totalPomodoros: number;
  completedPomodoros: number;
  totalFocusTime: number;
  tasks: {
    total: number;
    completed: number;
  };
  mostProductiveDay?: string;
}

// Aylık istatistikler tipi
export interface MonthlyStats {
  month: number; // 0-11 arası (JavaScript'teki ay indeksi)
  year: number;
  weeks: WeeklyStats[];
  totalPomodoros: number;
  completedPomodoros: number;
  totalFocusTime: number;
  tasks: {
    total: number;
    completed: number;
  };
  mostProductiveWeek?: {
    startDate: string;
    endDate: string;
  };
}

// Saat bazlı verimlilik analizi
export interface HourlyProductivity {
  hour: number; // 0-23 arası
  sessionsCount: number;
  focusTime: number;
  productivity: number; // 0-100 arası verimlilik puanı
}

// Görev tamamlama istatistikleri
export interface TaskCompletionStats {
  date: string;
  completed: number;
  total: number;
  completionRate: number; // 0-100 arası
}

// AI analiz önerileri
export interface AIProductivityInsight {
  insight: string;
  score: number; // 0-100 arası etki puanı
  category: 'time' | 'task' | 'focus' | 'break' | 'habit';
  recommendation: string;
}
