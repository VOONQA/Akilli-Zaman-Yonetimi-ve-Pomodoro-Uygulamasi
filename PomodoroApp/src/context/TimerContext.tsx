import React, { createContext, useContext, useState, useEffect } from 'react';

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
  stats: {
    completedPomodoros: number;
    todayFocusTime: number;
  };
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  changeTimerType: (type: TimerType) => void;
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

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;

    if (timerState === TimerState.RUNNING) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (timerType === TimerType.POMODORO) {
              setStats(prev => ({
                ...prev,
                completedPomodoros: prev.completedPomodoros + 1,
                todayFocusTime: prev.todayFocusTime + totalDuration
              }));
            }
            setTimerState(TimerState.COMPLETED);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerState, timerType, totalDuration]);

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

  const value = {
    timerState,
    timerType,
    timeRemaining,
    totalDuration,
    currentCycle,
    stats,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    changeTimerType
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