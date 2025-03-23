import React, { createContext, useContext, ReactNode } from 'react';

interface SettingsContextType {
  // Şimdilik boş
}

const SettingsContext = createContext<SettingsContextType>({});

export function useSettings() {
  return useContext(SettingsContext);
}

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  return (
    <SettingsContext.Provider value={{}}>
      {children}
    </SettingsContext.Provider>
  );
};