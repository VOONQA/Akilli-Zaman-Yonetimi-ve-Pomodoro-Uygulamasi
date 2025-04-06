import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  color?: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  minutes, 
  seconds, 
  color = '#FF5722' 
}) => {
  // İki basamaklı sayılar için formatlama
  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : `${time}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, { color }]}>
        {formatTime(minutes)}:{formatTime(seconds)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
  },
});

export default TimerDisplay;
