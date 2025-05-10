import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BADGES, Badge, UserBadge, BadgeLevel } from '../models/Badge';
import { useDatabase } from './DatabaseContext';

// SQLite veritabanı sonuç tipi tanımı
interface SQLiteResultSet {
  rows: {
    length: number;
    item: (index: number) => any;
    _array?: any[];
  };
  rowsAffected: number;
  insertId?: number;
}

// SQLite veritabanı sonuç tipi
type SQLiteResult = {
  [key: string]: any;
} & SQLiteResultSet;

interface BadgeContextType {
  badges: Badge[];
  userBadges: UserBadge[];
  checkForNewBadges: () => void;
  hasPendingBadges: boolean;
  clearPendingBadges: () => void;
  pendingBadges: UserBadge[];
  getAllBadges: () => Promise<Badge[]>;
  getLockedBadges: () => Promise<Badge[]>;
}

const BadgeContext = createContext<BadgeContextType>({
  badges: [],
  userBadges: [],
  checkForNewBadges: () => {},
  hasPendingBadges: false,
  clearPendingBadges: () => {},
  pendingBadges: [],
  getAllBadges: async () => [],
  getLockedBadges: async () => [],
});

export const useBadge = () => useContext(BadgeContext);

interface BadgeProviderProps {
  children: ReactNode;
}

export const BadgeProvider: React.FC<BadgeProviderProps> = ({ children }) => {
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [pendingBadges, setPendingBadges] = useState<UserBadge[]>([]);
  const { db } = useDatabase();

  // Veritabanı hazır olduğunda başlangıç verilerini yükle
  useEffect(() => {
    if (db) {
      initializeAndLoadBadges();
    }
  }, [db]);

  // Başlangıç işlemleri ve veri yükleme
  const initializeAndLoadBadges = async () => {
    if (!db) return;
    
    try {
      // 1. Sistem rozetlerini veritabanına kaydet
      await initializeBadges();
      // 2. Kullanıcı rozetlerini yükle
      await loadUserBadges();
    } catch (error) {
      console.error('Rozet verilerini yüklerken hata:', error);
    }
  };

  // Sistem rozetlerini veritabanına kaydet
  const initializeBadges = async () => {
    if (!db) return;

    try {
      // Tüm rozetleri veritabanına ekle (eğer yoksa)
      for (const badge of BADGES) {
        const query = `
          INSERT OR IGNORE INTO badges (id, name, description, type, thresholds, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
          const now = new Date().toISOString();
          await db.execute(query, [
            badge.id,
            badge.name,
            badge.description,
            badge.type,
            JSON.stringify(badge.thresholds),
            now,
            now
          ]);
        } catch (err) {
          console.error(`Badge ${badge.id} eklenirken hata:`, err);
        }
      }
      
      // Başarılı olduktan sonra veritabanından tüm rozetleri yükle
      const storedBadges = await fetchAllBadgesFromDB();
      if (storedBadges.length > 0) {
        setBadges(storedBadges);
      }
      
      console.log('Sistem rozetleri başarıyla yüklendi');
    } catch (error) {
      console.error('Rozet verileri kaydedilirken hata:', error);
    }
  };

  // Veritabanından tüm rozetleri getir
  const fetchAllBadgesFromDB = async (): Promise<Badge[]> => {
    if (!db) return BADGES;

    try {
      // Execute dönen değeri SQLiteResult olarak dönüştür
      const result = await db.execute('SELECT * FROM badges') as unknown as SQLiteResult;
      const fetchedBadges: Badge[] = [];
      
      if (result && result.rows && result.rows.length > 0) {
        for (let i = 0; i < result.rows.length; i++) {
          const item = result.rows.item(i);
          if (item) {
            fetchedBadges.push({
              id: item.id,
              name: item.name,
              description: item.description,
              type: item.type,
              thresholds: JSON.parse(item.thresholds)
            });
          }
        }
      }
      
      return fetchedBadges.length > 0 ? fetchedBadges : BADGES;
    } catch (error) {
      console.error('Rozetleri veritabanından getirirken hata:', error);
      return BADGES;
    }
  };

  // Kullanıcı rozet verilerini yükle
  const loadUserBadges = async () => {
    if (!db) return;

    try {
      // Promise tipi olarak select kullanıyoruz
      const result = await db.select<{
        id: string;
        badge_id: string; 
        level: number;
        progress: number;
        earned_at: string;
      }>('SELECT * FROM user_badges');
      
      if (!result) {
        console.error('User badges result is null');
        return;
      }
      
      const fetchedUserBadges: UserBadge[] = result.map(item => ({
        badgeId: item.badge_id,
        level: item.level,
        progress: item.progress,
        earnedAt: new Date(item.earned_at)
      }));
      
      console.log(`Yüklenen kullanıcı rozetleri: ${fetchedUserBadges.length}`);
      setUserBadges(fetchedUserBadges);
    } catch (error) {
      console.error('Kullanıcı rozetlerini yüklerken hata:', error);
    }
  };

  // Kullanıcıya yeni rozet ekle veya güncelle
  const saveUserBadge = async (badgeId: string, level: BadgeLevel, progress: number) => {
    if (!db) return;

    try {
      const now = new Date().toISOString();
      
      // Önce böyle bir rozet var mı kontrol et
      const checkResult = await db.select<{id: string}>('SELECT id FROM user_badges WHERE badge_id = ?', [badgeId]);
      let exists = checkResult.length > 0;
      
      if (exists) {
        // Varsa güncelle
        await db.execute(`
          UPDATE user_badges
          SET level = ?, progress = ?, updated_at = ?
          WHERE badge_id = ?
        `, [level, progress, now, badgeId]);
      } else {
        // Yoksa ekle
        const id = Math.random().toString(36).substring(2, 15);
        
        await db.execute(`
          INSERT INTO user_badges (id, badge_id, level, progress, earned_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [id, badgeId, level, progress, now, now, now]);
      }
      
      // Kullanıcı rozetlerini tekrar yükle
      await loadUserBadges();
    } catch (error) {
      console.error('Rozet verisi kaydedilirken hata:', error);
    }
  };

  // Yeni rozetleri kontrol et
  const checkForNewBadges = async () => {
    if (!db) return;
    
    try {
      // Veritabanından direkt sorgularla gerekli verileri çekelim
      
      // Toplam odaklanma süresi (dakika)
      const focusTimeResult = await db.select<{total_focus_time: number}>(`
        SELECT SUM(duration) / 60 as total_focus_time
        FROM pomodoro_sessions 
        WHERE type = 'pomodoro' AND completed = 1
      `);
      
      // Tamamlanan görevler
      const tasksResult = await db.select<{total_tasks_completed: number}>(`
        SELECT COUNT(*) as total_tasks_completed 
        FROM tasks 
        WHERE is_completed = 1
      `);
      
      // Tamamlanan pomodorolar
      const pomodoroResult = await db.select<{total_pomodoro_completed: number}>(`
        SELECT COUNT(*) as total_pomodoro_completed 
        FROM pomodoro_sessions 
        WHERE type = 'pomodoro' AND completed = 1
      `);
      
      // Günlük kullanım için streak hesaplama
      const streakResult = await db.select<{days_streak: number}>(`
        SELECT COUNT(DISTINCT date) as days_streak 
        FROM pomodoro_sessions 
        WHERE completed = 1
      `);
      
      // Mükemmel pomodorolar (25 dakika tam odaklanma)
      const perfectPomodoroResult = await db.select<{perfect_pomodoro_count: number}>(`
        SELECT COUNT(*) as perfect_pomodoro_count 
        FROM pomodoro_sessions 
        WHERE type = 'pomodoro' AND completed = 1 AND duration = 1500
      `);
      
      // Sonuçları alıp default 0 değerleriyle koruyalım
      const totalFocusTime = focusTimeResult[0]?.total_focus_time || 0;
      const totalTasksCompleted = tasksResult[0]?.total_tasks_completed || 0;
      const totalPomodoroCompleted = pomodoroResult[0]?.total_pomodoro_completed || 0;
      const daysStreak = streakResult[0]?.days_streak || 0;
      const perfectPomodoroCount = perfectPomodoroResult[0]?.perfect_pomodoro_count || 0;
      
      console.log('Veritabanı istatistikleri:', {
        totalFocusTime,
        totalTasksCompleted,
        totalPomodoroCompleted,
        daysStreak,
        perfectPomodoroCount
      });
      
      // Önce kullanıcının tüm rozetlerini güncel verilerle yükleyelim
      await loadUserBadges();
      
      // Tüm rozet türlerini kontrol et
      const badgesToCheck = await fetchAllBadgesFromDB();
      
      // Kullanıcının kazandığı rozetleri takip etmek için dizi oluşturalım
      const newEarnedBadges: UserBadge[] = [];
      
      for (const badge of badgesToCheck) {
        let currentProgress = 0;
        
        // Rozet türüne göre ilerlemeyi hesapla
        switch (badge.type) {
          case 'focusTime':
            currentProgress = totalFocusTime;
            break;
          case 'tasksCompleted':
            currentProgress = totalTasksCompleted;
            break;
          case 'daysStreak':
            currentProgress = daysStreak;
            break;
          case 'pomodoroCompleted':
            currentProgress = totalPomodoroCompleted;
            break;
          case 'perfectPomodoro':
            currentProgress = perfectPomodoroCount;
            break;
        }
        
        // Mevcut rozeti bul
        const existingBadge = userBadges.find(ub => ub.badgeId === badge.id);
        
        // Hangi seviyeyi kazandığını belirle
        let newLevel = BadgeLevel.NONE;
        
        if (currentProgress >= badge.thresholds[2]) {
          newLevel = BadgeLevel.GOLD;
        } else if (currentProgress >= badge.thresholds[1]) {
          newLevel = BadgeLevel.SILVER;
        } else if (currentProgress >= badge.thresholds[0]) {
          newLevel = BadgeLevel.BRONZE;
        }
        
        // Seviye yükseldiyse veya yeni rozet kazanıldıysa
        if (newLevel > BadgeLevel.NONE && (!existingBadge || existingBadge.level < newLevel)) {
          // Rozeti kaydet
          await saveUserBadge(badge.id, newLevel, currentProgress);
          
          // Yeni kazanılan rozeti listeye ekle
          const newBadge: UserBadge = {
            badgeId: badge.id,
            level: newLevel,
            progress: currentProgress,
            earnedAt: new Date()
          };
          
          newEarnedBadges.push(newBadge);
        } 
        // İlerleme kaydedildiyse güncelle
        else if (existingBadge && currentProgress > existingBadge.progress) {
          await saveUserBadge(badge.id, existingBadge.level, currentProgress);
        }
      }
      
      // Sadece yeni kazanılan rozetler varsa pendingBadges'e ekle
      if (newEarnedBadges.length > 0) {
        setPendingBadges(newEarnedBadges);
      }
      
      // Ayrıca bu verileri user_profile tablosuna da güncelleyelim
      await updateUserProfile({
        totalFocusTime,
        totalTasksCompleted,
        totalPomodoroCompleted,
        daysStreak,
        perfectPomodoroCount
      });
      
      // Kullanıcı rozetlerini son duruma göre tekrar yükle
      await loadUserBadges();
      
    } catch (error) {
      console.error('Rozet kontrolü yapılırken hata:', error);
    }
  };

  // Profil verilerini güncelle
  const updateUserProfile = async (stats: {
    totalFocusTime: number;
    totalTasksCompleted: number;
    totalPomodoroCompleted: number;
    daysStreak: number;
    perfectPomodoroCount: number;
  }) => {
    if (!db) return;
    
    try {
      const now = new Date().toISOString();
      
      // Profil var mı diye kontrol et
      const profileResult = await db.select<{id: string}>('SELECT * FROM user_profile LIMIT 1');
      let profileExists = profileResult.length > 0;
      
      if (profileExists) {
        // Profil varsa güncelle
        await db.execute(`
          UPDATE user_profile
          SET 
            total_focus_time = ?,
            total_tasks_completed = ?,
            total_pomodoro_completed = ?,
            perfect_pomodoro_count = ?,
            days_streak = ?,
            updated_at = ?
          WHERE id = ?
        `, [
          stats.totalFocusTime,
          stats.totalTasksCompleted,
          stats.totalPomodoroCompleted,
          stats.perfectPomodoroCount,
          stats.daysStreak,
          now,
          profileResult[0].id
        ]);
      } else {
        // Profil yoksa oluştur
        const id = Math.random().toString(36).substring(2, 15);
        
        await db.execute(`
          INSERT INTO user_profile (
            id, display_name, total_focus_time, total_tasks_completed, 
            total_pomodoro_completed, perfect_pomodoro_count, days_streak,
            last_active_date, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          'Pomodoro Kullanıcısı',
          stats.totalFocusTime,
          stats.totalTasksCompleted,
          stats.totalPomodoroCompleted,
          stats.perfectPomodoroCount,
          stats.daysStreak,
          now,
          now,
          now
        ]);
      }
    } catch (error) {
      console.error('Kullanıcı profili güncellenirken hata:', error);
    }
  };

  // Tüm rozetleri getir (kazanılmış ve kazanılmamış)
  const getAllBadges = async (): Promise<Badge[]> => {
    return await fetchAllBadgesFromDB();
  };

  // Henüz kazanılmamış rozetleri getir
  const getLockedBadges = async (): Promise<Badge[]> => {
    try {
      const allBadges = await fetchAllBadgesFromDB();
      const locked = allBadges.filter(badge => 
        !userBadges.some(userBadge => userBadge.badgeId === badge.id)
      );
      console.log(`Kazanılmamış rozet sayısı: ${locked.length}`);
      return locked;
    } catch (error) {
      console.error('Kazanılmamış rozetleri alırken hata:', error);
      return [];
    }
  };

  // Bekleyen bildirimleri temizle
  const clearPendingBadges = () => {
    setPendingBadges([]);
  };

  return (
    <BadgeContext.Provider
      value={{
        badges,
        userBadges,
        checkForNewBadges,
        hasPendingBadges: pendingBadges.length > 0,
        clearPendingBadges,
        pendingBadges,
        getAllBadges,
        getLockedBadges
      }}
    >
      {children}
    </BadgeContext.Provider>
  );
};
