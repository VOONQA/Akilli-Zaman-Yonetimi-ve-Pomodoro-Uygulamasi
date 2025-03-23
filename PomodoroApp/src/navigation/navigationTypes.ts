import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Ana tab navigasyonu için route isimleri (Home'u kaldırdık)
export type TabParamList = {
  Timer: undefined;
  Tasks: undefined;
  Statistics: undefined;
  Settings: undefined;
};

// Ana stack navigasyonu için route isimleri
export type RootStackParamList = {
  MainTabs: undefined;
  TaskDetail: { taskId: number };
  EditTask: { taskId?: number };
  AchievementsScreen: undefined;
  TimerSettingsScreen: undefined;
  NotificationsSettingsScreen: undefined;
};

// Tab navigator prop tipleri
export type TabNavigationProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  StackNavigationProp<RootStackParamList>
>;

export type TabRouteProp<T extends keyof TabParamList> = RouteProp<TabParamList, T>;

// Stack navigator prop tipleri
export type RootNavigationProp<T extends keyof RootStackParamList> = StackNavigationProp<
  RootStackParamList,
  T
>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

// Navigasyon prop'ları için yardımcı tipler
export type TabScreenProps<T extends keyof TabParamList> = {
  navigation: TabNavigationProp<T>;
  route: TabRouteProp<T>;
};

export type RootScreenProps<T extends keyof RootStackParamList> = {
  navigation: RootNavigationProp<T>;
  route: RootRouteProp<T>;
};