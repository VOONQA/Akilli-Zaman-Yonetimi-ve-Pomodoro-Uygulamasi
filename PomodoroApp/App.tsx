import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import MainApp from './src/App';
import { DatabaseProvider } from './src/context/DatabaseContext';
import { TaskProvider } from './src/context/TaskContext';
import { TimerProvider } from './src/context/TimerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { StatisticsProvider } from './src/context/StatisticsContext';
import { BadgeProvider } from './src/context/BadgeContext';
import { theme } from './src/constants/theme';
import { ChatProvider } from './src/context/ChatContext';
import { YouTubeProvider } from './src/context/YouTubeContext';
import { NoteProvider } from './src/context/NoteContext';
import ChatButton from './src/components/chat/ChatButton';
import ChatModal from './src/components/chat/ChatModal';
///
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <PaperProvider theme={theme}>
          <DatabaseProvider>
            <ChatProvider>
              <SettingsProvider>
                <TaskProvider>
                  <TimerProvider>
                    <StatisticsProvider>
                      <BadgeProvider>
                        <YouTubeProvider>
                          <NoteProvider>
                            <View style={styles.container}>
                              <MainApp />
                              <ChatButton />
                              <ChatModal />
                              <StatusBar style="auto" />
                            </View>
                          </NoteProvider>
                        </YouTubeProvider>
                      </BadgeProvider>
                    </StatisticsProvider>
                  </TimerProvider>
                </TaskProvider>
              </SettingsProvider>
            </ChatProvider>
          </DatabaseProvider>
        </PaperProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});