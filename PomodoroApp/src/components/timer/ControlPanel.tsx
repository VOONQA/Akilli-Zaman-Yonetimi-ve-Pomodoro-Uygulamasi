import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

enum TimerState {
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

interface ControlPanelProps {
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onNext: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  timerState,
  onStart,
  onPause,
  onReset,
  onNext
}) => {
  return (
    <View style={styles.container}>
      {/* Ana buton (Başlat / Durdur) */}
      <TouchableOpacity
        style={[styles.button, styles.mainButton]}
        onPress={timerState === TimerState.RUNNING ? onPause : onStart}
      >
        <Ionicons
          name={timerState === TimerState.RUNNING ? 'pause' : 'play'}
          size={32}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Sıfırla buton */}
      {(timerState === TimerState.PAUSED || timerState === TimerState.COMPLETED) && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onReset}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Sonraki buton */}
      {timerState === TimerState.COMPLETED && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onNext}
        >
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  mainButton: {
    backgroundColor: '#FF5722',
    width: 70,
    height: 70,
  },
  secondaryButton: {
    backgroundColor: '#666',
    width: 50,
    height: 50,
  },
});

export default ControlPanel;
