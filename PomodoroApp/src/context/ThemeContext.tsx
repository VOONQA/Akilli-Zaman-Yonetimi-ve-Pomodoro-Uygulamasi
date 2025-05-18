import React, { createContext, useContext, ReactNode } from 'react';
import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Kendi tema renklerimiz için bir tip oluşturalım
interface CustomThemeColors {
  pomodoroRed: string;
  shortBreakGreen: string; 
  longBreakBlue: string;
}

// ThemeContext değeri için tip tanımı
interface ThemeContextType {
  theme: MD3Theme;
  customColors: CustomThemeColors;
}

// Varsayılan özel renkler
const defaultCustomColors: CustomThemeColors = {
  pomodoroRed: '#FF5722',
  shortBreakGreen: '#4CAF50',
  longBreakBlue: '#2196F3',
};

// Özel temamızı oluşturalım
const customTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4a6da7',
    secondary: '#4CAF50',
    background: '#f5f5f7',
    surface: '#ffffff',
    onSurface: '#333333',
    error: '#e74c3c',
  },
  dark: false,
};

const ThemeContext = createContext<ThemeContextType>({
  theme: customTheme,
  customColors: defaultCustomColors,
});

export function useAppTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ 
      theme: customTheme, 
      customColors: defaultCustomColors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 