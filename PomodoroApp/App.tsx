import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import MainApp from './src/App';
import { DatabaseProvider } from './src/context/DatabaseContext';
import { TaskProvider } from './src/context/TaskContext';
import { TimerProvider } from './src/context/TimerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { StatisticsProvider } from './src/context/StatisticsContext';
import { BadgeProvider } from './src/context/BadgeContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { ChatProvider } from './src/context/ChatContext';
import { YouTubeProvider } from './src/context/YouTubeContext';
import { NoteProvider } from './src/context/NoteContext';
import ChatButton from './src/components/chat/ChatButton';
import ChatModal from './src/components/chat/ChatModal';
///
// PaperProvider'ı ThemeProvider'dan sonra kullanmak için ayrı bir bileşen
const ThemedApp = () => {
  const { theme } = useAppTheme();
  
  // Navigation teması
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
    }
  };
  
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <MainApp />
          <ChatButton />
          <ChatModal />
          <StatusBar style="dark" />
        </View>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <ChatProvider>
          <SettingsProvider>
            <ThemeProvider>
              <TaskProvider>
                <TimerProvider>
                  <StatisticsProvider>
                    <BadgeProvider>
                      <YouTubeProvider>
                        <NoteProvider>
                          <ThemedApp />
                        </NoteProvider>
                      </YouTubeProvider>
                    </BadgeProvider>
                  </StatisticsProvider>
                </TimerProvider>
              </TaskProvider>
            </ThemeProvider>
          </SettingsProvider>
        </ChatProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});