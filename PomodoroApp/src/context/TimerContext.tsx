import React, { createContext, useContext, ReactNode } from 'react';

interface TimerContextType {
  // Şimdilik boş
}

const TimerContext = createContext<TimerContextType>({});

export function useTimer() {
  return useContext(TimerContext);
}

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  return (
    <TimerContext.Provider value={{}}>
      {children}
    </TimerContext.Provider>
  );
};