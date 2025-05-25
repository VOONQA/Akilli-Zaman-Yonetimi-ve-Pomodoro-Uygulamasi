import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Tab navigatör için parametre listesi
export type TabsParamList = {
  Timer: undefined;
  Tasks: { initialFilter?: 'all' | 'today' | 'upcoming' | 'completed' } | undefined;
  Statistics: undefined;
  Settings: undefined;
};

// Ana stack navigasyonu için route isimleri
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabsParamList> | undefined;
  TaskDetail: { taskId: string };
  EditTask: {
    taskId?: string;
    initialDate?: Date;
    initialDateString?: string;
  };
  AchievementsScreen: undefined;
  TimerSettingsScreen: undefined;
  NotificationsSettingsScreen: undefined;
  CalendarEventImport: { calendarEvents: any[] };
  // Auth ekranları
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  AccountSettings: undefined;
  EmailVerification: { email: string };
};

// Tab navigator prop tipleri
export type TabNavigationProp<T extends keyof TabsParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, T>,
  StackNavigationProp<RootStackParamList>
>;

export type TabRouteProp<T extends keyof TabsParamList> = RouteProp<TabsParamList, T>;

// Stack navigator prop tipleri
export type RootNavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<
  RootStackParamList,
  T
>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

// Screen props tanımları
export type RootScreenProps<T extends keyof RootStackParamList> = 
  StackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, T>,
  RootScreenProps<keyof RootStackParamList>
>;
//