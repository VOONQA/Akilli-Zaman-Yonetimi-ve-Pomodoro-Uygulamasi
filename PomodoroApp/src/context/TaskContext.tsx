import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import uuid from 'react-native-uuid';
import { Task, CreateTaskDTO, TaskCalendarItem } from '../models/Task';
import { useDatabase } from './DatabaseContext';

// Context tip tanımı
interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  getTasks: () => Promise<Task[]>;
  getTaskById: (id: string) => Promise<Task | null>;
  getTasksByDate: (date: Date) => Promise<Task[]>;
  getTasksByDateRange: (startDate: Date, endDate: Date) => Promise<Task[]>;
  getTasksForCalendar: (startDate: Date, endDate: Date) => Promise<TaskCalendarItem[]>;
  addTask: (task: CreateTaskDTO) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<boolean>;
  completeTask: (id: string) => Promise<Task>;
  incrementPomodoroCount: (id: string) => Promise<Task>;
  toggleTaskCompletion: (id: string) => Promise<Task>;
  incrementTaskFocusTime: (id: string, duration: number) => Promise<Task>;
}

// Context oluşturma
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Provider props tipi
interface TaskProviderProps {
  children: ReactNode;
}

// Helper function for date formatting
const formatDateForSQL = (date: Date): string => {
  return date.toISOString();
};

// Helper function for parsing dates from SQL
const parseDateFromSQL = (dateStr: string): Date => {
  return new Date(dateStr);
};

// Provider bileşeni
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  const { db, isLoading: isDbLoading } = useDatabase();

  // Görevleri veritabanından yükle
  const loadTasks = async () => {
    if (!db || isDbLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await db.select<any>(`
        SELECT * FROM tasks ORDER BY date DESC
      `);
      
      // SQL sonuçlarını Task nesnesine dönüştür
      const loadedTasks: Task[] = result.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        date: parseDateFromSQL(row.date),
        dueDate: row.due_date ? parseDateFromSQL(row.due_date) : undefined,
        isCompleted: row.is_completed === 1,
        pomodoroCount: row.pomodoro_count,
        completedPomodoros: row.completed_pomodoros,
        totalFocusTime: row.total_focus_time || 0,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: parseDateFromSQL(row.created_at),
        updatedAt: parseDateFromSQL(row.updated_at)
      }));
      
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Görevler yüklenirken hata:', err);
      setError('Görevler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Veritabanı hazır olduğunda görevleri yükle
  useEffect(() => {
    if (!isDbLoading && db) {
      loadTasks();
    }
  }, [db, isDbLoading]);

  // Tüm görevleri getir
  const getTasks = async (): Promise<Task[]> => {
    return tasks;
  };

  // ID'ye göre görev getir
  const getTaskById = async (id: string): Promise<Task | null> => {
    if (!db) return null;
    
    try {
      const result = await db.select<any>(`
        SELECT * FROM tasks WHERE id = ?
      `, [id]);
      
      if (result.length === 0) return null;
      
      const row = result[0];
      return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        date: parseDateFromSQL(row.date),
        dueDate: row.due_date ? parseDateFromSQL(row.due_date) : undefined,
        isCompleted: row.is_completed === 1,
        pomodoroCount: row.pomodoro_count,
        completedPomodoros: row.completed_pomodoros,
        totalFocusTime: row.total_focus_time || 0,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: parseDateFromSQL(row.created_at),
        updatedAt: parseDateFromSQL(row.updated_at)
      };
    } catch (err) {
      console.error('Görev detayları alınırken hata:', err);
      return null;
    }
  };

  // Belirli bir tarihe ait görevleri getir
  const getTasksByDate = async (date: Date): Promise<Task[]> => {
    if (!db) return [];
    
    const dateStr = formatDateForSQL(new Date(date.setHours(0, 0, 0, 0)));
    const nextDay = formatDateForSQL(new Date(date.setHours(23, 59, 59, 999)));
    
    try {
      const result = await db.select<any>(`
        SELECT * FROM tasks 
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC
      `, [dateStr, nextDay]);
      
      return result.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        date: parseDateFromSQL(row.date),
        dueDate: row.due_date ? parseDateFromSQL(row.due_date) : undefined,
        isCompleted: row.is_completed === 1,
        pomodoroCount: row.pomodoro_count,
        completedPomodoros: row.completed_pomodoros,
        totalFocusTime: row.total_focus_time || 0,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: parseDateFromSQL(row.created_at),
        updatedAt: parseDateFromSQL(row.updated_at)
      }));
    } catch (err) {
      console.error('Görevler tarihe göre alınırken hata:', err);
      return [];
    }
  };

  // Belirli bir tarih aralığındaki görevleri getir
  const getTasksByDateRange = async (startDate: Date, endDate: Date): Promise<Task[]> => {
    if (!db) return [];
    
    const startStr = formatDateForSQL(new Date(startDate.setHours(0, 0, 0, 0)));
    const endStr = formatDateForSQL(new Date(endDate.setHours(23, 59, 59, 999)));
    
    try {
      const result = await db.select<any>(`
        SELECT * FROM tasks 
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC
      `, [startStr, endStr]);
      
      return result.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        date: parseDateFromSQL(row.date),
        dueDate: row.due_date ? parseDateFromSQL(row.due_date) : undefined,
        isCompleted: row.is_completed === 1,
        pomodoroCount: row.pomodoro_count,
        completedPomodoros: row.completed_pomodoros,
        totalFocusTime: row.total_focus_time || 0,
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: parseDateFromSQL(row.created_at),
        updatedAt: parseDateFromSQL(row.updated_at)
      }));
    } catch (err) {
      console.error('Tarih aralığındaki görevler alınırken hata:', err);
      return [];
    }
  };

  // Takvim görünümü için belirli tarih aralığındaki görevleri getir
  const getTasksForCalendar = async (startDate: Date, endDate: Date): Promise<TaskCalendarItem[]> => {
    if (!db) return [];
    
    const startStr = formatDateForSQL(new Date(startDate.setHours(0, 0, 0, 0)));
    const endStr = formatDateForSQL(new Date(endDate.setHours(23, 59, 59, 999)));
    
    try {
      const result = await db.select<any>(`
        SELECT id, title, is_completed, date 
        FROM tasks 
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC
      `, [startStr, endStr]);
      
      return result.map(row => ({
        id: row.id,
        title: row.title,
        isCompleted: row.is_completed === 1,
        date: parseDateFromSQL(row.date)
      }));
    } catch (err) {
      console.error('Takvim görevleri alınırken hata:', err);
      return [];
    }
  };

  // Yeni görev ekle
  const addTask = async (taskData: CreateTaskDTO): Promise<Task> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    const now = new Date();
    const newTask: Task = {
      id: uuid.v4().toString(),
      title: taskData.title,
      description: taskData.description || '',
      date: taskData.date,
      dueDate: taskData.dueDate,
      isCompleted: false,
      pomodoroCount: taskData.pomodoroCount || 1,
      completedPomodoros: 0,
      totalFocusTime: taskData.totalFocusTime || 0,
      tags: taskData.tags || [],
      createdAt: now,
      updatedAt: now
    };
    
    try {
      await db.insert('tasks', {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        date: formatDateForSQL(newTask.date),
        due_date: newTask.dueDate ? formatDateForSQL(newTask.dueDate) : null,
        is_completed: newTask.isCompleted ? 1 : 0,
        pomodoro_count: newTask.pomodoroCount,
        completed_pomodoros: newTask.completedPomodoros,
        total_focus_time: newTask.totalFocusTime,
        tags: JSON.stringify(newTask.tags),
        created_at: formatDateForSQL(newTask.createdAt),
        updated_at: formatDateForSQL(newTask.updatedAt)
      });
      
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      console.error('Görev eklenirken hata:', err);
      throw new Error('Görev eklenirken bir hata oluştu');
    }
  };

  // Görev güncelle
  const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    // Önce mevcut görevi al
    const existingTask = await getTaskById(id);
    if (!existingTask) throw new Error('Güncellenecek görev bulunamadı');
    
    // Yeni verileri mevcut görev ile birleştir
    const updatedTask: Task = {
      ...existingTask,
      ...taskData,
      updatedAt: new Date()
    };
    
    try {
      // Veritabanında güncelle
      const data: Record<string, any> = {
        title: updatedTask.title,
        description: updatedTask.description,
        date: formatDateForSQL(updatedTask.date),
        is_completed: updatedTask.isCompleted ? 1 : 0,
        pomodoro_count: updatedTask.pomodoroCount,
        completed_pomodoros: updatedTask.completedPomodoros,
        total_focus_time: updatedTask.totalFocusTime,
        tags: JSON.stringify(updatedTask.tags),
        updated_at: formatDateForSQL(updatedTask.updatedAt)
      };
      
      if (updatedTask.dueDate) {
        data.due_date = formatDateForSQL(updatedTask.dueDate);
      }
      
      await db.update('tasks', data, 'id = ?', [id]);
      
      // Yerel state'i güncelle
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      
      return updatedTask;
    } catch (err) {
      console.error('Görev güncellenirken hata:', err);
      throw new Error('Görev güncellenirken bir hata oluştu');
    }
  };

  // Görev sil
  const deleteTask = async (id: string): Promise<boolean> => {
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    try {
      await db.delete('tasks', 'id = ?', [id]);
      
      // Yerel state'ten kaldır
      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err) {
      console.error('Görev silinirken hata:', err);
      return false;
    }
  };

  // Görevi tamamlandı olarak işaretle
  const completeTask = async (id: string): Promise<Task> => {
    return updateTask(id, { isCompleted: true });
  };

  // Tamamlanan pomodoro sayısını artır
  const incrementPomodoroCount = async (id: string): Promise<Task> => {
    // Mevcut görevi al
    const task = await getTaskById(id);
    if (!task) throw new Error('Görev bulunamadı');
    
    // Tamamlanan pomodoro sayısını artır
    const completedPomodoros = task.completedPomodoros + 1;
    
    // Güncelle
    return updateTask(id, { completedPomodoros });
  };

  // Görev tamamlanma durumunu değiştir
  const toggleTaskCompletion = async (taskId: string): Promise<Task> => {
    // Mevcut görevi al
    const task = await getTaskById(taskId);
    if (!task) throw new Error('Görev bulunamadı');
    
    // Tamamlanma durumunu tersine çevir
    const isCompleted = !task.isCompleted;
    
    // SQLite ile güncelle (firebase yerine)
    const updatedTask = await updateTask(taskId, { 
      isCompleted: isCompleted,
      updatedAt: new Date()
    });
    
    // Güncellendiğini bildir
    setLastUpdate(Date.now());
    
    return updatedTask;
  };

  // Görev için geçirilen süreyi artır
  const incrementTaskFocusTime = async (id: string, duration: number): Promise<Task> => {
    // Mevcut görevi al
    const task = await getTaskById(id);
    if (!task) throw new Error('Görev bulunamadı');
    
    // Odaklanma süresini artır
    const totalFocusTime = task.totalFocusTime + duration;
    
    // Güncelle
    return updateTask(id, { totalFocusTime });
  };

  const value: TaskContextType = {
    tasks,
    isLoading,
    error,
    lastUpdate,
    getTasks,
    getTaskById,
    getTasksByDate,
    getTasksByDateRange,
    getTasksForCalendar,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    incrementPomodoroCount,
    toggleTaskCompletion,
    incrementTaskFocusTime
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook
export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export default TaskContext;