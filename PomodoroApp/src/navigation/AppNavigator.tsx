import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

// Tab Navigator
import TabNavigator from './TabNavigator';

// Ekranlar
import TaskDetailScreen from '../screens/tasks/TaskDetail';
import EditTaskScreen from '../screens/tasks/EditTask';
import AchievementsScreen from '../screens/achievements/AchievementsScreen';
import TimerSettingsScreen from '../screens/settings/TimerSettings';
import NotificationsSettingsScreen from '../screens/settings/NotificationSettings';

// Tip tanımlamaları
import { RootStackParamList } from './navigationTypes';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const theme = useTheme();
//
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: 'Görev Detayı' }}
      />
      
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={({ route }) => ({
          title: route.params?.taskId ? 'Görevi Düzenle' : 'Yeni Görev',
        })}
      />
      
      <Stack.Screen
        name="AchievementsScreen"
        component={AchievementsScreen}
        options={{ title: 'Başarılar' }}
      />
      
      <Stack.Screen
        name="TimerSettingsScreen"
        component={TimerSettingsScreen}
        options={{ title: 'Zamanlayıcı Ayarları' }}
      />
      
      <Stack.Screen
        name="NotificationsSettingsScreen"
        component={NotificationsSettingsScreen}
        options={{ title: 'Bildirim Ayarları' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;