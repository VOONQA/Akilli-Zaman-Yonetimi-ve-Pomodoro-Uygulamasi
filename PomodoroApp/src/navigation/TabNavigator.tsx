import React, { useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Platform, TouchableOpacity, View, Text } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Ekranlar
import TimerScreen from '../screens/timer/TimerScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import StatsScreen from '../screens/statistics/StatsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Tip tanımlamaları
import { TabsParamList } from './navigationTypes';

// Tab bar yüksekliği
export const TAB_BAR_HEIGHT = 60;

const Tab = createBottomTabNavigator<TabsParamList>();

const TabNavigator: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const insets = useSafeAreaInsets();

  const handlePageSelected = (e: any) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  };

  const screens = [
    { title: 'Zamanlayıcı', icon: 'timer-outline' },
    { title: 'Görevler', icon: 'list-outline' },
    { title: 'İstatistikler', icon: 'bar-chart-outline' },
    { title: 'Ayarlar', icon: 'settings-outline' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
        scrollEnabled={true}
        overdrag={true}
      >
        <View key="timer" style={{ flex: 1 }}>
          <TimerScreen 
            navigation={navigation as any}
            route={{ 
              key: 'Timer',
              name: 'Timer',
              params: undefined 
            } as any}
          />
        </View>
        <View key="tasks" style={{ flex: 1 }}>
          <TasksScreen 
            navigation={navigation as any}
            route={{ 
              key: 'Tasks',
              name: 'Tasks',
              params: undefined 
            } as any}
          />
        </View>
        <View key="statistics" style={{ flex: 1 }}>
          <StatsScreen 
            navigation={navigation as any}
            route={{ 
              key: 'Statistics',
              name: 'Statistics',
              params: undefined 
            } as any}
          />
        </View>
        <View key="settings" style={{ flex: 1 }}>
          <SettingsScreen 
            navigation={navigation as any}
            route={{ 
              key: 'Settings',
              name: 'Settings',
              params: undefined 
            } as any}
          />
        </View>
      </PagerView>

      {/* Custom Tab Bar - Safe Area ile yukarı taşındı */}
      <View style={{
        height: TAB_BAR_HEIGHT + insets.bottom,
        backgroundColor: theme.colors.background,
        elevation: 8,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderTopWidth: 0,
        flexDirection: 'row',
        paddingBottom: insets.bottom, // Alt güvenli alan boşluğu
        paddingTop: 8, // Üstten biraz boşluk
      }}>
        {screens.map((screen, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
            }}
            onPress={() => handleTabPress(index)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={screen.icon as any}
              size={22}
              color={currentPage === index ? theme.colors.primary : 'gray'}
              style={{ marginBottom: 2 }}
            />
            <Text style={{
              fontSize: 10,
              fontWeight: '500',
              color: currentPage === index ? theme.colors.primary : 'gray',
            }}>
              {screen.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default TabNavigator;
//