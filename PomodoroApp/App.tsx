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
import { theme } from './src/constants/theme';
///
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <PaperProvider theme={theme}>
          <DatabaseProvider>
            <SettingsProvider>
              <TaskProvider>
                <TimerProvider>
                  <View style={styles.container}>
                    <MainApp />
                    <StatusBar style="auto" />
                  </View>
                </TimerProvider>
              </TaskProvider>
            </SettingsProvider>
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