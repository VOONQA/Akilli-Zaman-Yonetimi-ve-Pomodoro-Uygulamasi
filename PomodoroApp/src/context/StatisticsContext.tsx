import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatISO, subDays, subWeeks, subMonths, parseISO, format, eachWeekOfInterval, startOfWeek, startOfMonth } from 'date-fns';
import uuid from 'react-native-uuid';
import { useDatabase } from './DatabaseContext';
import { PomodoroSession, CreatePomodoroSessionDTO } from '../models/PomodoroSession';
import { 
  DailyStats, 
  WeeklyStats, 
  MonthlyStats,
  HourlyProductivity,
  TaskCompletionStats 
} from '../types/statistics';
import { useTask } from './TaskContext';
import { AIRecommendation, CreateAIRecommendationDTO } from '../models/AIRecommendation';

// Context tip tanımı
interface StatisticsContextType {
  isLoading: boolean;
  error: string | null;
  addPomodoroSession: (session: CreatePomodoroSessionDTO) => Promise<PomodoroSession>;
  getDailyStats: (date: Date) => Promise<DailyStats>;
  getWeeklyStats: (date: Date) => Promise<WeeklyStats>;
  getMonthlyStats: (date: Date) => Promise<MonthlyStats>;
  getProductivityByHour: (startDate: Date, endDate: Date) => Promise<HourlyProductivity[]>;
  getTaskCompletionStats: (startDate: Date, endDate: Date) => Promise<TaskCompletionStats[]>;
  getMostProductiveTimePeriod: () => Promise<{hour: number, day: string, productivity: number}>;
  getAIRecommendations: (timeRange: 'daily' | 'weekly' | 'monthly', date: Date) => Promise<AIRecommendation | null>;
  saveAIRecommendations: (recommendations: CreateAIRecommendationDTO) => Promise<void>;
}

// ISO tarih formatı için yardımcı fonksiyon
const formatDateForSQL = (date: Date): string => {
  return formatISO(date);
};

// SQL tarih formatından dönüştürme için yardımcı fonksiyon
const parseDateFromSQL = (dateStr: string): Date => {
  return parseISO(dateStr);
};

// Context oluşturma
const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

// Context provider oluşturma
export const StatisticsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { db } = useDatabase();
  const { getTasks } = useTask();
  
  // Pomodoro oturumu ekle
  const addPomodoroSession = async (sessionData: CreatePomodoroSessionDTO): Promise<PomodoroSession> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    const now = new Date();
    const newSession: PomodoroSession = {
      id: uuid.v4().toString(),
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: sessionData.duration,
      taskId: sessionData.taskId,
      type: sessionData.type,
      completed: sessionData.completed,
      date: sessionData.date,
      timeOfDay: sessionData.timeOfDay,
      createdAt: now,
      updatedAt: now
    };
    
    try {
      await db.insert('pomodoro_sessions', {
        id: newSession.id,
        start_time: formatDateForSQL(newSession.startTime),
        end_time: formatDateForSQL(newSession.endTime),
        duration: newSession.duration,
        task_id: newSession.taskId || null,
        type: newSession.type,
        completed: newSession.completed ? 1 : 0,
        date: newSession.date,
        time_of_day: newSession.timeOfDay,
        created_at: formatDateForSQL(newSession.createdAt),
        updated_at: formatDateForSQL(newSession.updatedAt)
      });
      
      return newSession;
    } catch (err) {
      console.error('Pomodoro oturumu eklenirken hata:', err);
      throw new Error('Pomodoro oturumu eklenirken bir hata oluştu');
    }
  };
  
  // Günlük istatistikleri getir
  const getDailyStats = async (date: Date): Promise<DailyStats> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Tarih formatını hazırla
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // O gün için pomodoro oturumlarını getir
      const pomodoroSessions = await db.select<any>(`
        SELECT * FROM pomodoro_sessions 
        WHERE date = ? AND type = 'pomodoro'
      `, [dateStr]);
      
      // O gün için görevleri getir
      const tasks = await getTasks();
      const dailyTasks = tasks.filter(
        task => format(task.date, 'yyyy-MM-dd') === dateStr
      );
      
      // İstatistikleri hesapla
      const totalPomodoros = pomodoroSessions.length;
      const completedPomodoros = pomodoroSessions.filter(session => session.completed === 1).length;
      const totalFocusTime = pomodoroSessions.reduce((total, session) => total + session.duration, 0);
      
      // En verimli saati bul
      const hourlyPomodoros = new Array(24).fill(0);
      pomodoroSessions.forEach(session => {
        hourlyPomodoros[session.time_of_day] += 1;
      });
      
      const mostProductiveHour = hourlyPomodoros.indexOf(Math.max(...hourlyPomodoros));
      
      return {
        date: dateStr,
        totalPomodoros,
        completedPomodoros,
        totalFocusTime,
        tasks: {
          total: dailyTasks.length,
          completed: dailyTasks.filter(task => task.isCompleted).length
        },
        mostProductiveHour: mostProductiveHour > 0 ? mostProductiveHour : undefined
      };
    } catch (err) {
      const errorMsg = 'Günlük istatistikler alınırken bir hata oluştu';
      setError(errorMsg);
      console.error(errorMsg, err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Diğer fonksiyonlar burada eklenir (getWeeklyStats, getMonthlyStats, vb.)
  const getWeeklyStats = async (date: Date): Promise<WeeklyStats> => {
    // İlgili haftanın günlük istatistiklerini topla
    const startDate = subDays(date, date.getDay());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const days: DailyStats[] = [];
    let totalPomodoros = 0;
    let completedPomodoros = 0;
    let totalFocusTime = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Haftanın her günü için istatistikleri getir
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayStats = await getDailyStats(currentDate);
      days.push(dayStats);
      
      totalPomodoros += dayStats.totalPomodoros;
      completedPomodoros += dayStats.completedPomodoros;
      totalFocusTime += dayStats.totalFocusTime;
      totalTasks += dayStats.tasks.total;
      completedTasks += dayStats.tasks.completed;
    }
    
    // En verimli günü bul
    const mostProductiveDay = days.reduce((prev, current, index) => {
      if (index === 0) return { day: current.date, productivity: current.completedPomodoros };
      return current.completedPomodoros > prev.productivity 
        ? { day: current.date, productivity: current.completedPomodoros }
        : prev;
    }, { day: '', productivity: 0 }).day;
    
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      days,
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
  
  const getMonthlyStats = async (date: Date): Promise<MonthlyStats> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Ayın ilk ve son gününü hesapla
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Ayın ilk ve son günü için SQL formatında tarihler
      const firstDayStr = format(firstDay, 'yyyy-MM-dd');
      const lastDayStr = format(lastDay, 'yyyy-MM-dd');
      
      // Bu ay içindeki tüm pomodoro oturumlarını getir
      const pomodoroSessions = await db.select<any>(`
        SELECT * FROM pomodoro_sessions 
        WHERE date >= ? AND date <= ? AND type = 'pomodoro'
      `, [firstDayStr, lastDayStr]);
      
      // Bu ay içindeki tüm görevleri getir
      const tasks = await getTasks();
      const monthlyTasks = tasks.filter(
        task => {
          const taskDate = new Date(task.date);
          return taskDate.getMonth() === month && taskDate.getFullYear() === year;
        }
      );
      
      // İstatistikleri hesapla
      const totalPomodoros = pomodoroSessions.length;
      const completedPomodoros = pomodoroSessions.filter(session => session.completed === 1).length;
      const totalFocusTime = pomodoroSessions.reduce((total, session) => total + session.duration, 0);
      
      // Haftalık verileri organize et
      const weeks = eachWeekOfInterval({
        start: firstDay,
        end: lastDay
      }).map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Bu haftanın başlangıç ve bitiş tarihleri
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
        
        // Bu hafta içindeki oturumları filtrele
        const weekSessions = pomodoroSessions.filter(
          session => session.date >= weekStartStr && session.date <= weekEndStr
        );
        
        // Bu hafta içindeki görevleri filtrele
        const weekTasks = monthlyTasks.filter(task => {
          const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
          return taskDate >= weekStartStr && taskDate <= weekEndStr;
        });
        
        // Bu hafta için boş günlük istatistik dizisi oluştur
        const weekDays: DailyStats[] = [];
        
        // Haftanın her günü için istatistikleri oluştur
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + i);
          const dayDateStr = format(dayDate, 'yyyy-MM-dd');
          
          // Bu gün için oturumları filtrele
          const daySessions = weekSessions.filter(
            session => session.date === dayDateStr
          );
          
          // Bu gün için görevleri filtrele
          const dayTasks = weekTasks.filter(task => {
            const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
            return taskDate === dayDateStr;
          });
          
          // Günlük istatistikleri hesapla
          const dayStats: DailyStats = {
            date: dayDateStr,
            totalPomodoros: daySessions.length,
            completedPomodoros: daySessions.filter(session => session.completed === 1).length,
            totalFocusTime: daySessions.reduce((total, session) => total + session.duration, 0),
            tasks: {
              total: dayTasks.length,
              completed: dayTasks.filter(task => task.isCompleted).length
            }
          };
          
          weekDays.push(dayStats);
        }
        
        return {
          startDate: weekStartStr,
          endDate: weekEndStr,
          days: weekDays,
          totalPomodoros: weekDays.reduce((sum, day) => sum + day.totalPomodoros, 0),
          completedPomodoros: weekDays.reduce((sum, day) => sum + day.completedPomodoros, 0),
          totalFocusTime: weekDays.reduce((sum, day) => sum + day.totalFocusTime, 0),
          tasks: {
            total: weekDays.reduce((sum, day) => sum + day.tasks.total, 0),
            completed: weekDays.reduce((sum, day) => sum + day.tasks.completed, 0)
          }
        };
      });
      
      // En verimli haftayı bul
      let mostProductiveWeek = null;
      if (weeks.length > 0) {
        mostProductiveWeek = weeks.reduce((prev, current, index) => {
          if (index === 0) return { index: 0, productivity: current.completedPomodoros };
          return current.completedPomodoros > prev.productivity 
            ? { index: index, productivity: current.completedPomodoros }
            : prev;
        }, { index: -1, productivity: 0 });
      }
      
      return {
        month,
        year,
        weeks,
        totalPomodoros,
        completedPomodoros,
        totalFocusTime,
        tasks: {
          total: monthlyTasks.length,
          completed: monthlyTasks.filter(task => task.isCompleted).length
        },
        mostProductiveWeek: mostProductiveWeek ? weeks[mostProductiveWeek.index] : undefined
      };
    } catch (err) {
      const errorMsg = 'Aylık istatistikler alınırken bir hata oluştu';
      setError(errorMsg);
      console.error(errorMsg, err);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getProductivityByHour = async (startDate: Date, endDate: Date): Promise<HourlyProductivity[]> => {
    // Burada implementasyon gerekli
    return [];
  };
  
  const getTaskCompletionStats = async (startDate: Date, endDate: Date): Promise<TaskCompletionStats[]> => {
    // Burada implementasyon gerekli
    return [];
  };
  
  const getMostProductiveTimePeriod = async () => {
    // Burada implementasyon gerekli
    return { hour: 0, day: '', productivity: 0 };
  };
  
  // AI önerileri getirme
  const getAIRecommendations = async (timeRange: 'daily' | 'weekly' | 'monthly', date: Date): Promise<AIRecommendation | null> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    // Tarihten timeLabel oluştur
    let timeLabel = '';
    if (timeRange === 'daily') {
      timeLabel = format(date, 'yyyy-MM-dd');
    } else if (timeRange === 'weekly') {
      // Haftanın başlangıç tarihini al
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      timeLabel = format(weekStart, 'yyyy-MM-dd');
    } else {
      // Ay başlangıcı
      timeLabel = format(startOfMonth(date), 'yyyy-MM');
    }
    
    try {
      // Veritabanından önerileri al
      interface AIRecommendationDB {
        id: string;
        user_id: string;
        time_range: string;
        time_label: string;
        insights: string;
        most_productive_hour: number | null;
        most_productive_day: string | null;
        created_at: string;
        updated_at: string;
      }
      
      const recommendations = await db.select<AIRecommendationDB>(
        `SELECT * FROM ai_recommendations 
         WHERE time_range = ? AND time_label = ? 
         ORDER BY created_at DESC LIMIT 1`,
        [timeRange, timeLabel]
      );
      
      if (recommendations && recommendations.length > 0) {
        const rec = recommendations[0];
        const recommendation: AIRecommendation = {
          id: rec.id,
          userId: rec.user_id,
          timeRange: rec.time_range as 'daily' | 'weekly' | 'monthly',
          timeLabel: rec.time_label,
          insights: JSON.parse(rec.insights),
          mostProductiveHour: rec.most_productive_hour || undefined,
          mostProductiveDay: rec.most_productive_day || undefined,
          createdAt: parseDateFromSQL(rec.created_at)
        };
        return recommendation;
      }
      
      return null;
    } catch (error) {
      console.error('AI önerileri alınırken hata:', error);
      return null;
    }
  };
  
  // AI önerilerini kaydet
  const saveAIRecommendations = async (recommendations: CreateAIRecommendationDTO): Promise<void> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    try {
      const id = uuid.v4().toString();
      const now = new Date();
      
      await db.insert('ai_recommendations', {
        id,
        user_id: recommendations.userId,
        time_range: recommendations.timeRange,
        time_label: recommendations.timeLabel,
        insights: JSON.stringify(recommendations.insights),
        most_productive_hour: recommendations.mostProductiveHour,
        most_productive_day: recommendations.mostProductiveDay,
        created_at: formatDateForSQL(now),
        updated_at: formatDateForSQL(now)
      });
    } catch (error) {
      console.error('AI önerileri kaydedilirken hata:', error);
      throw new Error('AI önerilerini kaydetme hatası');
    }
  };
  
  // Context değerini oluştur
  const value = {
    isLoading,
    error,
    addPomodoroSession,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getProductivityByHour,
    getTaskCompletionStats,
    getMostProductiveTimePeriod,
    getAIRecommendations,
    saveAIRecommendations
  };
  
  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};

// Context hook'u
export const useStatistics = (): StatisticsContextType => {
  const context = useContext(StatisticsContext);
  
  if (context === undefined) {
    throw new Error('useStatistics hook ancak StatisticsProvider içinde kullanılabilir');
  }
  
  return context;
};
