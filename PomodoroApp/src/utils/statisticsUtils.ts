import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DailyStats, WeeklyStats, MonthlyStats, HourlyProductivity } from '../types/statistics';

/**
 * Saat dilimlerine göre verimlilik puanı hesaplar
 */
export const calculateProductivityScore = (
  completedPomodoros: number,
  totalPomodoros: number,
  focusTime: number
): number => {
  if (totalPomodoros === 0) return 0;
  
  // Tamamlama oranı
  const completionRate = completedPomodoros / totalPomodoros;
  
  // Odaklanma süresi (2 saatten fazlası için maksimum puan)
  const focusTimeScore = Math.min(focusTime / (2 * 60 * 60), 1);
  
  // Ağırlıklı ortalama (tamamlama oranı %70, odaklanma süresi %30)
  return Math.round((completionRate * 0.7 + focusTimeScore * 0.3) * 100);
};

/**
 * Haftanın günlerini formatlayarak döndürür
 */
export const getFormattedDaysOfWeek = (date: Date): string[] => {
  const weekStart = startOfWeek(date, { locale: tr });
  const weekEnd = endOfWeek(date, { locale: tr });
  
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  return days.map(day => format(day, 'E', { locale: tr }));
};

/**
 * Ay içindeki haftaları formatlayarak döndürür
 */
export const getFormattedWeeksOfMonth = (date: Date): { start: string, end: string }[] => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  const firstDay = startOfWeek(monthStart, { locale: tr });
  const lastDay = endOfWeek(monthEnd, { locale: tr });
  
  const result: { start: string, end: string }[] = [];
  let currentWeekStart = firstDay;
  
  while (currentWeekStart <= lastDay) {
    const currentWeekEnd = endOfWeek(currentWeekStart, { locale: tr });
    
    result.push({
      start: format(currentWeekStart, 'd MMM', { locale: tr }),
      end: format(currentWeekEnd, 'd MMM', { locale: tr })
    });
    
    currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() + 1);
  }
  
  return result;
};

/**
 * Bir dizi günlük istatistiği birleştirerek haftalık istatistiği oluşturur
 */
export const aggregateDailyStatsToWeekly = (dailyStats: DailyStats[]): WeeklyStats => {
  if (!dailyStats.length) {
    throw new Error('Haftalık istatistikler için günlük veri bulunamadı');
  }
  
  // Günleri sırala
  const sortedDays = [...dailyStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Toplamları hesapla
  const totalPomodoros = sortedDays.reduce((sum, day) => sum + day.totalPomodoros, 0);
  const completedPomodoros = sortedDays.reduce((sum, day) => sum + day.completedPomodoros, 0);
  const totalFocusTime = sortedDays.reduce((sum, day) => sum + day.totalFocusTime, 0);
  const totalTasks = sortedDays.reduce((sum, day) => sum + day.tasks.total, 0);
  const completedTasks = sortedDays.reduce((sum, day) => sum + day.tasks.completed, 0);
  
  // En verimli günü bul
  const mostProductiveDay = sortedDays.reduce((most, current) => {
    if (most.completedPomodoros < current.completedPomodoros) {
      return current;
    }
    return most;
  }, sortedDays[0]).date;
  
  return {
    startDate: sortedDays[0].date,
    endDate: sortedDays[sortedDays.length - 1].date,
    days: sortedDays,
    totalPomodoros,
    completedPomodoros,
    totalFocusTime,
    tasks: {
      total: totalTasks,
      completed: completedTasks
    },
    mostProductiveDay
  };
};

/**
 * Renk kodu oluşturma yardımcı fonksiyonu
 */
export const getColorForProductivity = (score: number): string => {
  if (score >= 80) return '#4CAF50'; // Yeşil
  if (score >= 60) return '#CDDC39'; // Açık yeşil
  if (score >= 40) return '#FFC107'; // Sarı
  if (score >= 20) return '#FF9800'; // Turuncu
  return '#F44336'; // Kırmızı
};

/**
 * Bir zaman diliminin etiketi için yardımcı fonksiyon
 */
export const getTimeFrameLabel = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Sabah';
  if (hour >= 12 && hour < 17) return 'Öğleden Sonra';
  if (hour >= 17 && hour < 21) return 'Akşam';
  return 'Gece';
};
