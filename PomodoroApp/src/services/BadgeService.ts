import { BADGES, Badge, BadgeType, BadgeLevel, UserBadge } from '../models/Badge';
import { UserProfile } from '../models/UserProfile';
import { Database } from '../types/database';
import { formatISO } from 'date-fns';
import uuid from 'react-native-uuid';

// Rozet kontrolü ve kazanma işlemleri
export class BadgeService {
  
  // Kullanıcının mevcut durumuna göre kazanılması gereken rozetleri kontrol et
  static checkAndUpdateBadges(profile: UserProfile): UserProfile {
    const updatedProfile = { ...profile };
    
    // Tüm rozetleri kontrol et
    BADGES.forEach(badge => {
      const existingBadge = updatedProfile.badges.find(ub => ub.badgeId === badge.id);
      
      // Rozet kontrolünü yap ve mevcut seviyeyi belirle
      const { earned, level, progress } = this.checkBadgeEarned(badge, profile);
      
      if (earned && (!existingBadge || existingBadge.level < level)) {
        // Yeni rozet kazanıldı veya seviye yükseltildi
        if (existingBadge) {
          // Mevcut rozeti güncelle
          existingBadge.level = level;
          existingBadge.progress = progress;
          existingBadge.earnedAt = new Date();
        } else {
          // Yeni rozet ekle
          updatedProfile.badges.push({
            badgeId: badge.id,
            level,
            progress,
            earnedAt: new Date(),
          });
        }
      } else if (existingBadge) {
        // İlerleme durumunu güncelle
        existingBadge.progress = progress;
      }
    });
    
    return updatedProfile;
  }
  
  // Belirli bir rozeti kullanıcının durumuna göre kontrol et
  static checkBadgeEarned(badge: Badge, profile: UserProfile): { earned: boolean, level: BadgeLevel, progress: number } {
    let progress = 0;
    
    // Rozet türüne göre ilerleme durumunu belirle
    switch (badge.type) {
      case BadgeType.FOCUS_TIME:
        progress = profile.totalFocusTime;
        break;
      case BadgeType.TASKS_COMPLETED:
        progress = profile.totalTasksCompleted;
        break;
      case BadgeType.DAYS_STREAK:
        progress = profile.daysStreak;
        break;
      case BadgeType.POMODORO_COMPLETED:
        progress = profile.totalPomodoroCompleted;
        break;
      case BadgeType.PERFECT_POMODORO:
        progress = profile.perfectPomodoroCount;
        break;
    }
    
    // En yüksek seviyeden başlayarak hangi seviyeyi kazandığını belirle
    if (progress >= badge.thresholds[2]) {
      return { earned: true, level: BadgeLevel.GOLD, progress };
    } else if (progress >= badge.thresholds[1]) {
      return { earned: true, level: BadgeLevel.SILVER, progress };
    } else if (progress >= badge.thresholds[0]) {
      return { earned: true, level: BadgeLevel.BRONZE, progress };
    }
    
    // Henüz kazanılmadı
    return { earned: false, level: BadgeLevel.NONE, progress };
  }
  
  // Bir kullanıcının belirli bir rozetteki ilerlemesini hesapla
  static calculateBadgeProgress(badge: Badge, userBadge?: UserBadge): { percentage: number, currentValue: number, nextThreshold: number } {
    if (!userBadge) {
      // Rozet henüz kazanılmadı
      return { percentage: 0, currentValue: 0, nextThreshold: badge.thresholds[0] };
    }
    
    const { level, progress } = userBadge;
    
    // En yüksek seviyeye ulaşıldı
    if (level === BadgeLevel.GOLD) {
      return { percentage: 100, currentValue: progress, nextThreshold: badge.thresholds[2] };
    }
    
    // Bir sonraki seviye eşiğini belirle
    const nextLevel = level + 1;
    const nextThreshold = badge.thresholds[nextLevel - 1];
    
    // Bir önceki seviye eşiği (veya 0)
    const prevThreshold = level === BadgeLevel.NONE ? 0 : badge.thresholds[level - 1];
    
    // İlerleme yüzdesini hesapla
    const valueInThisLevel = progress - prevThreshold;
    const rangeForThisLevel = nextThreshold - prevThreshold;
    const percentage = Math.min((valueInThisLevel / rangeForThisLevel) * 100, 100);
    
    return { percentage, currentValue: progress, nextThreshold };
  }
}

// Rozet tanımları
export const DEFAULT_BADGES = [
  {
    id: 'focus_master',
    name: 'Odak Ustası',
    description: 'Toplam odak süresine göre kazanılan rozet',
    type: BadgeType.FOCUS_TIME,
    thresholds: [120, 600, 1800], // 2 saat, 10 saat, 30 saat (dakika cinsinden)
  },
  {
    id: 'task_champion',
    name: 'Görev Şampiyonu',
    description: 'Tamamlanan görev sayısına göre kazanılan rozet',
    type: BadgeType.TASKS_COMPLETED,
    thresholds: [10, 50, 200], // 10, 50, 200 görev
  },
  {
    id: 'consistency_king',
    name: 'Süreklilik Kralı',
    description: 'Arka arkaya aktif günlere göre kazanılan rozet',
    type: BadgeType.DAYS_STREAK,
    thresholds: [3, 7, 30], // 3, 7, 30 gün
  },
  {
    id: 'pomodoro_master',
    name: 'Pomodoro Ustası',
    description: 'Tamamlanan pomodoro sayısına göre kazanılan rozet',
    type: BadgeType.POMODORO_COMPLETED,
    thresholds: [25, 100, 500], // 25, 100, 500 pomodoro
  },
  {
    id: 'perfection_seeker',
    name: 'Mükemmeliyetçi',
    description: 'Kesintisiz tamamlanan pomodorolar için rozet',
    type: BadgeType.PERFECT_POMODORO,
    thresholds: [5, 25, 100], // 5, 25, 100 mükemmel pomodoro
  }
];

// Rozet verilerinin veritabanına eklenmesi
export const initializeBadgesInDB = async (db: Database): Promise<void> => {
  try {
    // Önce mevcut rozetleri kontrol et
    const result = await db.execute('SELECT COUNT(*) as count FROM badges') as any;
    
    if (result?.rows?.item(0)?.count > 0) {
      console.log('Rozetler zaten veritabanında var, tekrar eklenmiyor');
      return;
    }
    
    console.log('Rozet verileri veritabanına yükleniyor...');
    
    const now = formatISO(new Date());
    
    // Tüm rozet tanımlarını ekle
    for (const badge of DEFAULT_BADGES) {
      const id = uuid.v4().toString();
      
      await db.execute(`
        INSERT INTO badges (id, name, description, type, thresholds, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        badge.name,
        badge.description,
        badge.type,
        JSON.stringify(badge.thresholds),
        now,
        now
      ]);
    }
    
    console.log('Rozet verileri başarıyla yüklendi');
  } catch (error) {
    console.error('Rozet verileri yüklenirken hata:', error);
    throw error;
  }
};

// Veritabanı başlatma sırasında çağrılacak
export const ensureDefaultUserProfile = async (db: Database): Promise<void> => {
  try {
    // Kullanıcı profili var mı kontrol et
    const result = await db.execute('SELECT COUNT(*) as count FROM user_profile') as any;
    
    if (result?.rows?.item(0)?.count > 0) {
      console.log('Kullanıcı profili zaten var, tekrar oluşturulmuyor');
      return;
    }
    
    console.log('Varsayılan kullanıcı profili oluşturuluyor...');
    
    const now = formatISO(new Date());
    const id = uuid.v4().toString();
    
    await db.execute(`
      INSERT INTO user_profile (
        id, display_name, total_focus_time, total_tasks_completed, 
        task_completion_rate, total_pomodoro_completed, perfect_pomodoro_count, 
        most_productive_day, most_productive_time, daily_focus_goal, 
        weekly_task_goal, days_streak, last_active_date, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      'Pomodoro Kullanıcısı',
      0, // total_focus_time
      0, // total_tasks_completed
      0, // task_completion_rate
      0, // total_pomodoro_completed
      0, // perfect_pomodoro_count
      null, // most_productive_day
      null, // most_productive_time
      120, // daily_focus_goal (2 saat)
      15, // weekly_task_goal
      0, // days_streak
      now, // last_active_date
      now, // created_at
      now // updated_at
    ]);
    
    console.log('Varsayılan kullanıcı profili oluşturuldu');
  } catch (error) {
    console.error('Kullanıcı profili oluşturulurken hata:', error);
    throw error;
  }
};
