import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../../navigation/navigationTypes';
import { useTimer, TimerType, TimerState } from '../../context/TimerContext';
import { TimerDisplay, ControlPanel, ProgressRing } from '../../components/timer';
import { styles } from './styles';

type Props = TabScreenProps<'Timer'>;

const TimerScreen: React.FC<Props> = ({ navigation }) => {
  const {
    timerState,
    timerType,
    timeRemaining,
    totalDuration,
    currentCycle,
    stats,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    changeTimerType
  } = useTimer();

  // İlerleme yüzdesini hesapla
  const progressPercentage = ((totalDuration - timeRemaining) / totalDuration) * 100;

  // Timer rengini belirle
  const getTimerColor = () => {
    switch (timerType) {
      case TimerType.POMODORO:
        return '#FF5722';
      case TimerType.SHORT_BREAK:
        return '#4CAF50';
      case TimerType.LONG_BREAK:
        return '#2196F3';
      default:
        return '#FF5722';
    }
  };

  useEffect(() => {
    if (timerState === TimerState.COMPLETED) {
      let nextType: TimerType;
      
      if (timerType === TimerType.POMODORO) {
        if (currentCycle % 4 === 0) {
          nextType = TimerType.LONG_BREAK;
        } else {
          nextType = TimerType.SHORT_BREAK;
        }
      } else {
        nextType = TimerType.POMODORO;
      }
      
      setTimeout(() => {
        changeTimerType(nextType);
      }, 1000);
    }
  }, [timerState, timerType, currentCycle]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {timerType === TimerType.POMODORO
            ? 'Pomodoro'
            : timerType === TimerType.SHORT_BREAK
              ? 'Kısa Mola'
              : 'Uzun Mola'}
        </Text>
      </View>

      <View style={styles.timerTypeButtons}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            timerType === TimerType.POMODORO && styles.activeTypeButton
          ]}
          onPress={() => changeTimerType(TimerType.POMODORO)}
        >
          <Text
            style={[
              styles.typeButtonText,
              timerType === TimerType.POMODORO && styles.activeTypeButtonText
            ]}
          >
            Pomodoro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            timerType === TimerType.SHORT_BREAK && styles.activeTypeButton
          ]}
          onPress={() => changeTimerType(TimerType.SHORT_BREAK)}
        >
          <Text
            style={[
              styles.typeButtonText,
              timerType === TimerType.SHORT_BREAK && styles.activeTypeButtonText
            ]}
          >
            Kısa Mola
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            timerType === TimerType.LONG_BREAK && styles.activeTypeButton
          ]}
          onPress={() => changeTimerType(TimerType.LONG_BREAK)}
        >
          <Text
            style={[
              styles.typeButtonText,
              timerType === TimerType.LONG_BREAK && styles.activeTypeButtonText
            ]}
          >
            Uzun Mola
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <ProgressRing
          progress={progressPercentage}
          size={280}
          strokeWidth={15}
          color={getTimerColor()}
        >
          <TimerDisplay
            minutes={Math.floor(timeRemaining / 60)}
            seconds={timeRemaining % 60}
            color={getTimerColor()}
          />
        </ProgressRing>
      </View>

      <ControlPanel
        timerState={timerState}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
        onNext={skipTimer}
      />

      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>
          {timerState === TimerState.READY && "Başlamaya hazır mısın?"}
          {timerState === TimerState.RUNNING && timerType === TimerType.POMODORO && "Şimdi odaklanma zamanı!"}
          {timerState === TimerState.RUNNING && timerType !== TimerType.POMODORO && "Rahatla ve dinlen!"}
          {timerState === TimerState.PAUSED && "Devam etmeye hazır olduğunda başlat!"}
          {timerState === TimerState.COMPLETED && "Tebrikler! Sonraki adıma geçebilirsin."}
        </Text>
      </View>

      <View style={styles.tasksPanel}>
        <View style={styles.tasksPanelHeader}>
          <Text style={styles.tasksPanelTitle}>Görevler</Text>
        </View>
        <Text style={styles.placeholderText}>Görev paneli burada eklenecek</Text>
      </View>
    </ScrollView>
  );
};

export default TimerScreen;