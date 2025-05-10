import { UserBadge } from './Badge';

// Kullanıcı profili için arayüz
export interface UserProfile {
  // Profil bilgileri
  id: string;
  displayName: string;
  
  // İstatistikler
  totalFocusTime: number; // dakika cinsinden
  totalTasksCompleted: number;
  taskCompletionRate: number; // 0-1 arası
  totalPomodoroCompleted: number;
  perfectPomodoroCount: number;
  
  // Verimlilik verileri
  mostProductiveDay: string;
  mostProductiveTime: string;
  
  // Rozetler
  badges: UserBadge[];
  
  // Hedefler
  dailyFocusGoal: number; // dakika cinsinden
  weeklyTaskGoal: number;
  
  // Takip durumu
  daysStreak: number;
  lastActiveDate: Date;
}

// Yeni bir kullanıcı profili oluşturma
export const createDefaultUserProfile = (): UserProfile => {
  return {
    id: 'user1',
    displayName: 'Pomodoro Kullanıcısı',
    totalFocusTime: 0,
    totalTasksCompleted: 0,
    taskCompletionRate: 0,
    totalPomodoroCompleted: 0,
    perfectPomodoroCount: 0,
    mostProductiveDay: 'Henüz veri yok',
    mostProductiveTime: 'Henüz veri yok',
    badges: [],
    dailyFocusGoal: 120, // 2 saat
    weeklyTaskGoal: 15,
    daysStreak: 0,
    lastActiveDate: new Date(),
  };
};
