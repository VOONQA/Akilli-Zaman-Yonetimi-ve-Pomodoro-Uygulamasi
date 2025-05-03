import { format, isToday, isYesterday, addDays, subDays, isThisWeek, isThisMonth, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getWeek, getMonth, getYear, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Tarihi YYYY-MM-DD formatına çevirir
 */
export const formatDateToYMD = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Tarihi gün/ay/yıl formatında gösterir
 */
export const formatDateLocalized = (date: Date): string => {
  return format(date, 'd MMMM yyyy', { locale: tr });
};

/**
 * Tarih aralığı metni oluşturur
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  return `${format(startDate, 'd MMM', { locale: tr })} - ${format(endDate, 'd MMM yyyy', { locale: tr })}`;
};

/**
 * Tarihi kullanıcı dostu formatta gösterir (bugün, dün, vb.)
 */
export const formatDateFriendly = (date: Date): string => {
  if (isToday(date)) {
    return 'Bugün';
  } else if (isYesterday(date)) {
    return 'Dün';
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE', { locale: tr });
  } else if (isThisMonth(date)) {
    return format(date, 'd MMMM', { locale: tr });
  } else {
    return format(date, 'd MMMM yyyy', { locale: tr });
  }
};

/**
 * Haftanın ilk ve son günlerini döndürür
 */
export const getWeekBoundaries = (date: Date): { start: Date, end: Date } => {
  const start = startOfWeek(date, { locale: tr });
  const end = endOfWeek(date, { locale: tr });
  return { start, end };
};

/**
 * Ayın ilk ve son günlerini döndürür
 */
export const getMonthBoundaries = (date: Date): { start: Date, end: Date } => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return { start, end };
};

/**
 * Bir tarih aralığı içindeki tüm günleri döndürür
 */
export const getDaysInRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

/**
 * İki tarih arasındaki hafta sayısını döndürür
 */
export const getWeeksBetween = (startDate: Date, endDate: Date): number => {
  const startWeek = getWeek(startDate);
  const endWeek = getWeek(endDate);
  const startYear = getYear(startDate);
  const endYear = getYear(endDate);
  
  // Aynı yıl içindeyse basit hesaplama
  if (startYear === endYear) {
    return endWeek - startWeek + 1;
  }
  
  // Farklı yıllar için hesaplama
  // Not: Bu basit bir hesaplama, yıl dönümlerinde bazı kesinlik sorunları olabilir
  const weeksInYear = 52;
  return (endYear - startYear) * weeksInYear + (endWeek - startWeek);
};

/**
 * Bir haftaya ait etiket oluşturur
 */
export const getWeekLabel = (date: Date): string => {
  const { start, end } = getWeekBoundaries(date);
  return `${format(start, 'd')} - ${format(end, 'd')} ${format(end, 'MMMM', { locale: tr })}`;
};

/**
 * Bir aya ait etiket oluşturur
 */
export const getMonthLabel = (date: Date): string => {
  return format(date, 'MMMM yyyy', { locale: tr });
};

/**
 * SQL veritabanından gelen ISO tarih formatını Türkçe formatına çevirir
 */
export const formatSQLDateToLocalized = (sqlDate: string): string => {
  const date = new Date(sqlDate);
  return format(date, 'd MMMM yyyy', { locale: tr });
};

/**
 * Saat aralıklarını insan dostu formatta döndürür
 */
export const getTimeLabel = (hour: number): string => {
  const hourString = hour.toString().padStart(2, '0');
  return `${hourString}:00`;
};
