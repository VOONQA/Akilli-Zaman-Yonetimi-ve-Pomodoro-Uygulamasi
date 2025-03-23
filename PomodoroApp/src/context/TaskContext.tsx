import React, { createContext, useContext, ReactNode } from 'react';

interface TaskContextType {
  // Şimdilik boş
}

const TaskContext = createContext<TaskContextType>({});

export function useTask() {
  return useContext(TaskContext);
}

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  return (
    <TaskContext.Provider value={{}}>
      {children}
    </TaskContext.Provider>
  );
};