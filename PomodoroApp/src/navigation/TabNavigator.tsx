import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Ekranlar
import TimerScreen from '../screens/timer/TimerScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import StatsScreen from '../screens/statistics/StatsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Tip tanımlamaları
import { TabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Timer') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
      initialRouteName="Timer" // Uygulama açıldığında zamanlayıcı ekranını göstersin
    >
      <Tab.Screen 
        name="Timer" 
        component={TimerScreen} 
        options={{ 
          title: 'Zamanlayıcı' 
        }} 
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ 
          title: 'Görevler' 
        }} 
      />
      <Tab.Screen 
        name="Statistics" 
        component={StatsScreen} 
        options={{ 
          title: 'İstatistikler' 
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: 'Ayarlar' 
        }} 
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;