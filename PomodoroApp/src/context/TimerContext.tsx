import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '../models/Task';
import { useTask } from './TaskContext';
import { useDatabase } from './DatabaseContext';
import { useSettings } from './SettingsContext';

export enum TimerType {
  POMODORO = 'pomodoro',
  SHORT_BREAK = 'shortBreak',
  LONG_BREAK = 'longBreak'
}

export enum TimerState {
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

type TimerContextType = {
  timerState: TimerState;
  timerType: TimerType;
  timeRemaining: number;
  totalDuration: number;
  currentCycle: number;
  completedPomodoros: number;
  currentTask: Task | null;
  stats: {
    completedPomodoros: number;
    todayFocusTime: number;
  };
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  changeTimerType: (type: TimerType) => void;
  startTimerWithTask: (task: Task) => void;
  clearTask: () => void;
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [timerState, setTimerState] = useState<TimerState>(TimerState.READY);
  const [timerType, setTimerType] = useState<TimerType>(TimerType.POMODORO);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [stats, setStats] = useState({
    completedPomodoros: 0,
    todayFocusTime: 0
  });
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [lastBreakType, setLastBreakType] = useState<TimerType | null>(null);
  
  const { getTaskById, incrementPomodoroCount, updateTask, incrementTaskFocusTime } = useTask();
  const { db } = useDatabase();
  const { settings } = useSettings();

  // Ayarları kullanarak timer'ı başlangıçta ayarla
  useEffect(() => {
    const duration = settings.timer.pomodoroMinutes * 60;
    setTimeRemaining(duration);
    setTotalDuration(duration);
  }, [settings.timer.pomodoroMinutes]);

  // Mevcut görevin bilgilerini yükle
  useEffect(() => {
    const loadCurrentTask = async () => {
      if (currentTaskId) {
        try {
          const task = await getTaskById(currentTaskId);
          if (task) {
            setCurrentTask(task);
          }
        } catch (error) {
          console.error('Görev yüklenirken hata oluştu:', error);
        }
      } else {
        setCurrentTask(null);
      }
    };
    
    loadCurrentTask();
  }, [currentTaskId, getTaskById]);

  // Kullanıcı profilini güncelle
  const updateUserProfile = async (focusTimeToAdd: number, isCompletedPomodoro: boolean) => {
    if (!db) return;
    
    try {
      // Önce mevcut profili kontrol et
      const profileResult = await db.execute('SELECT * FROM user_profile LIMIT 1') as any;
      
      // Sonuç kontrolü doğru şekilde yapılmalı
      if (profileResult && profileResult.rows && profileResult.rows.length > 0) {
        // Profil varsa güncelle
        const profile = profileResult.rows.item(0);
        
        // Yeni değerleri hesapla
        const total_focus_time = (profile.total_focus_time || 0) + Math.floor(focusTimeToAdd / 60); // saniyeden dakikaya çevir
        const total_pomodoro_completed = isCompletedPomodoro ? (profile.total_pomodoro_completed || 0) + 1 : profile.total_pomodoro_completed;
        
        // Profili güncelle
        await db.execute(`
          UPDATE user_profile
          SET total_focus_time = ?,
              total_pomodoro_completed = ?,
              updated_at = ?
          WHERE id = ?
        `, [
          total_focus_time,
          total_pomodoro_completed,
          new Date().toISOString(),
          profile.id
        ]);
      }
    } catch (error) {
      console.error('Kullanıcı profili güncellenirken hata:', error);
    }
  };

  // Timer tamamlandığında yapılacak işlemleri yöneten fonksiyon
  const handleTimerComplete = () => {
    // MOLADAN pomodoroya geçiş yapıyorsak önce kontrol edelim
    if (timerType === TimerType.SHORT_BREAK || timerType === TimerType.LONG_BREAK) {
      // Bu bir mola döngüsünden çıkış, direk pomodoro moduna geç
      changeTimerType(TimerType.POMODORO);
      
      // Otomatik başlatma ayarı açıksa başlat
      if (settings.timer.autoStartPomodoros) {
        setTimeout(() => startTimer(), 500);
      }
      return; // Buradan sonraki kodun çalışmasını engelleyelim
    }
    
    // Buraya geldiysek bir POMODORO tamamlanmıştır
    // Tamamlanan pomodoro sayısını artır
    const newCompletedPomodoros = completedPomodoros + 1;
    setCompletedPomodoros(newCompletedPomodoros);
    
    // DÜZELTME: Mod operatörü yerine doğrudan kontrol ekleyelim
    // Uzun mola zamanı geldi mi?
    // Şu anki pomodoro sayımız, ayarlardaki uzun mola için gerekli sayının tam katı mı?
    const breakType = (newCompletedPomodoros % settings.timer.pomodorosUntilLongBreak === 0)
      ? TimerType.LONG_BREAK  // Evet, uzun mola zamanı geldi
      : TimerType.SHORT_BREAK; // Hayır, normal kısa mola zamanı
      
    // Göstermelik olarak bir log verelim
    console.log('Tamamlanan pomodoro sayısı:', newCompletedPomodoros);
    console.log('Uzun mola öncesi pomodoro sayısı:', settings.timer.pomodorosUntilLongBreak);
    console.log('Mod hesabı:', newCompletedPomodoros % settings.timer.pomodorosUntilLongBreak);
    console.log('Seçilen mola tipi:', breakType);
      
    // Seçilen mola tipine geç
    changeTimerType(breakType);
    
    // Otomatik başlatma ayarı açıksa başlat
    if (settings.timer.autoStartBreaks) {
      setTimeout(() => startTimer(), 500);
    }
      
    // Döngüyü bir artır
    setCurrentCycle(currentCycle + 1);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null; 

    if (timerState === TimerState.RUNNING) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            
            if (timerType === TimerType.POMODORO) {
              setStats(prev => ({
                ...prev,
                completedPomodoros: prev.completedPomodoros + 1,
                todayFocusTime: prev.todayFocusTime + totalDuration
              }));
              
              // Kullanıcı profilini güncelle
              updateUserProfile(totalDuration, true);
              
              // Görev ile ilgili işlemleri burada yap
              if (currentTaskId && currentTask) {
                incrementTaskFocusTime(currentTaskId, totalDuration)
                  .then(() => {
                    return incrementPomodoroCount(currentTaskId);
                  })
                  .then(updatedTask => {
                    setCurrentTask(updatedTask);
                    
                    if (updatedTask.completedPomodoros >= updatedTask.pomodoroCount && !updatedTask.isCompleted) {
                      updateTask(currentTaskId, { isCompleted: true })
                        .then(completedTask => {
                          setCurrentTask(completedTask);
                          
                          setTimeout(() => {
                            setCurrentTask(null);
                            setCurrentTaskId(null);
                          }, 2000);
                        })
                        .catch(error => {
                          console.error('Görev tamamlandı olarak işaretlenirken hata oluştu:', error);
                        });
                    }
                  })
                  .catch(error => {
                    console.error('Pomodoro sayısı veya süre artırılırken hata oluştu:', error);
                  });
              }
            }
            
            setTimerState(TimerState.COMPLETED);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [timerState, timerType, totalDuration, currentTaskId, currentTask]);

  // Süre tamamlandığında handleTimerComplete fonksiyonunu çağır
  useEffect(() => {
    if (timerState === TimerState.COMPLETED) {
      // Zaman 0.5 saniye gecikme ekleyerek handleTimerComplete'i çağır
      // Bu, kullanıcıya "tamamlandı" durumunu görme şansı verir
      setTimeout(() => {
        handleTimerComplete();
      }, 500);
    }
  }, [timerState]);

  const startTimer = () => {
    setTimerState(TimerState.RUNNING);
  };

  const pauseTimer = () => {
    setTimerState(TimerState.PAUSED);
  };

  const resetTimer = () => {
    setTimerState(TimerState.READY);
    setTimeRemaining(totalDuration);
  };

  const skipTimer = () => {
    setTimerState(TimerState.COMPLETED);
  };

  const changeTimerType = (type: TimerType) => {
    setTimerType(type);
    let newDuration = 25 * 60;
    
    switch (type) {
      case TimerType.POMODORO:
        newDuration = settings.timer.pomodoroMinutes * 60;
        break;
      case TimerType.SHORT_BREAK:
        newDuration = settings.timer.shortBreakMinutes * 60;
        break;
      case TimerType.LONG_BREAK:
        newDuration = settings.timer.longBreakMinutes * 60;
        break;
    }
    
    setTotalDuration(newDuration);
    setTimeRemaining(newDuration);
    setTimerState(TimerState.READY);
  };

  const startTimerWithTask = (task: Task) => {
    setTimerType(TimerType.POMODORO);
    setCurrentTaskId(task.id);
    setCurrentTask(task);
    setTimeRemaining(settings.timer.pomodoroMinutes * 60);
    setTotalDuration(settings.timer.pomodoroMinutes * 60);
    setTimerState(TimerState.RUNNING);
  };

  const clearTask = () => {
    setCurrentTaskId(null);
    setCurrentTask(null);
  };

  const initializeTimer = (type: TimerType) => {
    switch (type) {
      case 'pomodoro':
        setTimerType(TimerType.POMODORO);
        setTimeRemaining(settings.timer.pomodoroMinutes * 60);
        break;
      case 'shortBreak':
        setTimerType(TimerType.SHORT_BREAK);
        setTimeRemaining(settings.timer.shortBreakMinutes * 60);
        break;
      case 'longBreak':
        setTimerType(TimerType.LONG_BREAK);
        setTimeRemaining(settings.timer.longBreakMinutes * 60);
        break;
    }
    setTimerState(TimerState.READY);
  };

  const value = {
    timerState,
    timerType,
    timeRemaining,
    totalDuration,
    currentCycle,
    completedPomodoros,
    currentTask,
    stats,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    changeTimerType,
    startTimerWithTask,
    clearTask
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export default TimerContext;