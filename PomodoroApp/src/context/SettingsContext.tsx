import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerSettings {
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface NotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  silentHoursStart: number;
  silentHoursEnd: number;
  soundType: string;
}

export interface UserSettings {
  timer: TimerSettings;
  notifications: NotificationSettings;
  isPremium: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  timer: {
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodorosUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
  },
  notifications: {
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    silentHoursStart: 22,
    silentHoursEnd: 8,
    soundType: 'default',
  },
  isPremium: false,
};

interface SettingsContextType {
  settings: UserSettings;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  togglePremium: (value: boolean) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateTimerSettings: () => {},
  updateNotificationSettings: () => {},
  togglePremium: () => {},
  isLoading: true,
});

export function useSettings() {
  return useContext(SettingsContext);
}

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata oluştu:', error);
    }
  };

  const updateTimerSettings = (timerSettings: Partial<TimerSettings>) => {
    const updatedSettings = {
      ...settings,
      timer: {
        ...settings.timer,
        ...timerSettings,
      },
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const updateNotificationSettings = (notificationSettings: Partial<NotificationSettings>) => {
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        ...notificationSettings,
      },
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  const togglePremium = (value: boolean) => {
    const updatedSettings = {
      ...settings,
      isPremium: value,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateTimerSettings,
        updateNotificationSettings,
        togglePremium,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};