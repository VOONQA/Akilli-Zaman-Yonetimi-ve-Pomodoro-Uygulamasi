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
  silentHoursStart: number; // 0-23 saat formatında
  silentHoursEnd: number; // 0-23 saat formatında
  soundType: string;
}

export interface ThemeSettings {
  darkMode: boolean;
  accentColor: string;
}

export interface PremiumSettings {
  isPremium: boolean;
  subscriptionExpiryDate?: string;
  subscriptionType?: 'month' | 'year';
}

export interface UserSettings {
  timer: TimerSettings;
  notifications: NotificationSettings;
  theme: ThemeSettings;
  premium: PremiumSettings;
  legalTermsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
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
  theme: {
    darkMode: false,
    accentColor: '#4a6da7',
  },
  premium: {
    isPremium: false,
  },
  legalTermsAccepted: false,
  privacyPolicyAccepted: false,
};
