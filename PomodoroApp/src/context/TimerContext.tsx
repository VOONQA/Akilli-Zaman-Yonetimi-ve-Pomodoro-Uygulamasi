import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '../models/Task';
import { useTask } from './TaskContext';

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
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [stats, setStats] = useState({
    completedPomodoros: 0,
    todayFocusTime: 0
  });
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  
  const { getTaskById, incrementPomodoroCount, updateTask, incrementTaskFocusTime } = useTask();

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
        interval = null;
      }
    };
  }, [timerState, timerType, totalDuration, currentTaskId, currentTask, incrementPomodoroCount, updateTask, incrementTaskFocusTime]);

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
        newDuration = 25 * 60;
        break;
      case TimerType.SHORT_BREAK:
        newDuration = 5 * 60;
        break;
      case TimerType.LONG_BREAK:
        newDuration = 15 * 60;
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
    setTimeRemaining(25 * 60);
    setTotalDuration(5 * 60);
    setTimerState(TimerState.RUNNING);
  };

  const clearTask = () => {
    setCurrentTaskId(null);
    setCurrentTask(null);
  };

  const value = {
    timerState,
    timerType,
    timeRemaining,
    totalDuration,
    currentCycle,
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