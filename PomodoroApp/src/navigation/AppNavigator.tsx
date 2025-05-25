import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

// Tab Navigator
import TabNavigator from './TabNavigator';

// Ekranlar
import TaskDetailScreen from '../screens/tasks/TaskDetail';
import EditTaskScreen from '../screens/tasks/EditTask';
import TimerSettingsScreen from '../screens/settings/TimerSettings';
import NotificationsSettingsScreen from '../screens/settings/NotificationSettings';

// Auth Ekranları
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import AccountSettingsScreen from '../screens/auth/AccountSettingsScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

// Tip tanımlamaları
import { RootStackParamList } from './navigationTypes';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const theme = useTheme();

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
        options={{
          headerShown: false
        }}
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

      {/* Auth Ekranları */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }} 
      />
      
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="AccountSettings" 
        component={AccountSettingsScreen} 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;