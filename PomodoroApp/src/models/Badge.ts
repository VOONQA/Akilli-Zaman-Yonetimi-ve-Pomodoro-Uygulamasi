// Rozet türleri
export enum BadgeType {
  FOCUS_TIME = 'focusTime',
  TASKS_COMPLETED = 'tasksCompleted',
  DAYS_STREAK = 'daysStreak',
  POMODORO_COMPLETED = 'pomodoroCompleted',
  PERFECT_POMODORO = 'perfectPomodoro',
}

// Rozet seviyeleri
export enum BadgeLevel {
  NONE = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
}

// Bir rozet tanımlama arayüzü
export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  // Her seviye için eşik değerleri (index 0: bronz, 1: gümüş, 2: altın)
  thresholds: number[];
}

// Kullanıcının kazandığı rozetleri temsil eden arayüz
export interface UserBadge {
  badgeId: string;
  level: BadgeLevel;
  progress: number;
  earnedAt: Date;
}

// Sistem rozetlerinin tanımlanması
export const BADGES: Badge[] = [
  {
    id: 'focus-master',
    name: 'Odak Ustası',
    description: 'Belirli bir süre odaklanarak çalış',
    type: BadgeType.FOCUS_TIME,
    thresholds: [60, 300, 1000], // dakika cinsinden (1 saat, 5 saat, 16.7 saat)
  },
  {
    id: 'task-champion',
    name: 'Görev Şampiyonu',
    description: 'Belirli sayıda görevi tamamla',
    type: BadgeType.TASKS_COMPLETED,
    thresholds: [10, 50, 100],
  },
  {
    id: 'consistency-king',
    name: 'İstikrar Kralı',
    description: 'Arka arkaya günlerde uygulama kullan',
    type: BadgeType.DAYS_STREAK,
    thresholds: [3, 7, 30],
  },
  {
    id: 'pomodoro-pro',
    name: 'Pomodoro Profesyoneli',
    description: 'Belirli sayıda pomodoro tamamla',
    type: BadgeType.POMODORO_COMPLETED,
    thresholds: [20, 100, 500],
  },
  {
    id: 'perfect-timing',
    name: 'Mükemmel Zamanlama',
    description: 'Pomodoro süresini tam olarak tamamla',
    type: BadgeType.PERFECT_POMODORO,
    thresholds: [5, 20, 50],
  },
];
