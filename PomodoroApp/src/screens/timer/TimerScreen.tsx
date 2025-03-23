import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TabScreenProps } from '../../navigation/navigationTypes';

type Props = TabScreenProps<'Timer'>;

const TimerScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zamanlayıcı</Text>
      <Text>Pomodoro zamanlayıcı burada olacak</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default TimerScreen;