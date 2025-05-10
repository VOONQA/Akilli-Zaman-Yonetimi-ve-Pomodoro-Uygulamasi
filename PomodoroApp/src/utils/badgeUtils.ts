import { Badge, BadgeLevel, UserBadge } from '../models/Badge';

// Rozet seviyesine göre bilgileri döndürür
export const getBadgeLevelInfo = (level: BadgeLevel) => {
  switch (level) {
    case BadgeLevel.BRONZE:
      return {
        color: '#CD7F32',
        name: 'Bronz',
        nextName: 'Gümüş',
      };
    case BadgeLevel.SILVER:
      return {
        color: '#C0C0C0',
        name: 'Gümüş',
        nextName: 'Altın',
      };
    case BadgeLevel.GOLD:
      return {
        color: '#FFD700',
        name: 'Altın',
        nextName: 'Maksimum',
      };
    default:
      return {
        color: '#999',
        name: 'Kilit',
        nextName: 'Bronz',
      };
  }
};

// Belirli bir rozetin ilerleme durumunu hesaplar
export const calculateProgress = (badge: Badge, userBadge: UserBadge | undefined) => {
  if (!userBadge) {
    return {
      currentLevel: BadgeLevel.NONE,
      nextLevel: BadgeLevel.BRONZE,
      progress: 0,
      nextThreshold: badge.thresholds[0],
      percentage: 0,
    };
  }

  const { level, progress } = userBadge;
  
  // En üst seviyeye ulaşıldıysa
  if (level === BadgeLevel.GOLD) {
    return {
      currentLevel: level,
      nextLevel: level,
      progress,
      nextThreshold: badge.thresholds[2],
      percentage: 100,
    };
  }

  // Bir sonraki seviye
  const nextLevel = level + 1 as BadgeLevel;
  
  // Bir sonraki seviye için gereken eşik değeri
  const nextThreshold = badge.thresholds[nextLevel - 1];
  
  // Bir önceki seviyenin eşik değeri
  const prevThreshold = level === BadgeLevel.NONE ? 0 : badge.thresholds[level - 1];
  
  // İlerleme yüzdesi
  const valueInCurrentLevel = progress - prevThreshold;
  const rangeForCurrentLevel = nextThreshold - prevThreshold;
  const percentage = Math.min((valueInCurrentLevel / rangeForCurrentLevel) * 100, 100);

  return {
    currentLevel: level,
    nextLevel,
    progress,
    nextThreshold,
    percentage,
  };
};

// Rozetin paylaşım metni
export const getBadgeShareText = (badge: Badge, level: BadgeLevel) => {
  const levelInfo = getBadgeLevelInfo(level);
  
  return `🏆 "${badge.name}" rozetinin ${levelInfo.name} seviyesini Pomodoro App'te kazandım! Çalışmalarıma devam ediyorum. #PomodoroDiscipline`;
};
