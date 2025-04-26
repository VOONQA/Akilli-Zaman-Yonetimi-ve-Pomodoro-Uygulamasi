import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../../navigation/navigationTypes';
import { useTimer, TimerType, TimerState } from '../../context/TimerContext';
import { TimerDisplay, ControlPanel, ProgressRing } from '../../components/timer';
import { styles } from './styles';
import { TaskList } from '../../components/tasks';
import { useTask } from '../../context/TaskContext';
import { Task } from '../../models/Task';
import TaskItem from '../../components/tasks/TaskItem';

type Props = TabScreenProps<'Timer'>;

const TimerScreen: React.FC<Props> = ({ navigation }) => {
  const {
    timerState,
    timerType,
    timeRemaining,
    totalDuration,
    currentCycle,
    currentTask,
    stats,
    startTimer,
    pauseTimer,
    resetTimer,
    skipTimer,
    changeTimerType,
    clearTask
  } = useTimer();

  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const { getTasks, toggleTaskCompletion, getTasksByDate } = useTask();
  
  // Animasyon değişkenlerini tanımla
  const fadeAnim = useRef(new Animated.Value(currentTask ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(currentTask ? 80 : 0)).current;
  
  // İlerleme yüzdesini hesapla - kapsamlı düzeltme
  const progressPercentage = 
    timerState === TimerState.COMPLETED || 
    timerState === TimerState.READY || 
    (timerState === TimerState.PAUSED && timeRemaining === totalDuration)
      ? 0 // Timer tamamlandığında, hazır durumdayken veya durdurulup resetlendiğinde yüzdeyi sıfırla
      : ((totalDuration - timeRemaining) / totalDuration) * 100;

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

  // Tamamlanan görevleri yükle
  useEffect(() => {
    const loadCompletedTasks = async () => {
      try {
        // Bugünün başlangıç ve bitiş tarihlerini hesapla
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // getTasksByDate fonksiyonunu kullan
        const todayTasks = await getTasksByDate(today);
        
        // Sadece tamamlanmış görevleri filtrele
        const completed = todayTasks.filter(task => task.isCompleted);
        setCompletedTasks(completed);
      } catch (error) {
        console.error('Tamamlanan görevler yüklenirken hata oluştu:', error);
      }
    };
    
    loadCompletedTasks();
    
    // Düzenli aralıklarla tamamlanan görevleri yenile
    const interval = setInterval(loadCompletedTasks, 3000);
    
    return () => clearInterval(interval);
  }, [getTasksByDate, toggleTaskCompletion, timerState]);

  // Animasyonun tamamlandığını takip etmek için bir ref kullan
  const animationRunning = useRef(false);

  // Animasyon fonksiyonunu güncelleyelim
  const animateTask = (visible: boolean) => {
    // Halihazırda çalışan bir animasyon varsa, onu iptal etmeye çalışma
    if (animationRunning.current) {
      return;
    }
    
    animationRunning.current = true;
    
    // Animasyonu başlat
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
    
    Animated.timing(heightAnim, {
      toValue: visible ? 80 : 0,
      duration: 500, 
      useNativeDriver: false,
    }).start(() => {
      // Animasyon tamamlandığında bayrağı sıfırla
      animationRunning.current = false;
    });
  };
  
  // Görev değiştiğinde veya tamamlandığında animasyonları kontrol et
  useEffect(() => {
    if (currentTask) {
      animateTask(!currentTask.isCompleted);
    } else {
      animateTask(false);
    }
  }, [currentTask]);

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

  // TaskDetail sayfasına navigasyon
  const navigateToTaskDetail = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  // Görevi temizlemek için fonksiyon ekleyelim
  const clearCurrentTask = () => {
    if (currentTask) {
      // Görev bilgisini temizle
      // Timer'ı sıfırla ama aynı modda kalsın
      resetTimer(); // Timer'ı durdur ve sıfırla
      
      // Context'te görev bilgisini temizleyelim
      // (Bu fonksiyonu TimerContext'e eklememiz gerekiyor)
      clearTask();
    }
  };

  // Boş görev listesi stilini tanımla
  const timerStyles = StyleSheet.create({
    tasksContainer: {
      marginTop: 20,
      marginBottom: 10,
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    emptyTasksContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      marginTop: 10
    },
    emptyTasksText: {
      fontSize: 14,
      color: '#999',
      marginTop: 8,
      textAlign: 'center'
    },
    taskList: {
      width: '100%',
    },
    taskListContent: {
      paddingVertical: 5
    },
    taskCloseButton: {
      padding: 6,
      borderRadius: 15,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {timerType === TimerType.POMODORO
              ? 'Pomodoro'
              : timerType === TimerType.SHORT_BREAK
                ? 'Kısa Mola'
                : 'Uzun Mola'}
          </Text>
        </View>

        {currentTask && (
          <Animated.View 
            style={[
              styles.currentTaskContainer, 
              { 
                opacity: fadeAnim,
                height: heightAnim 
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.currentTaskTouchable}
              onPress={() => navigateToTaskDetail(currentTask.id)}
            >
              <View style={styles.currentTaskInfo}>
                <Text style={styles.currentTaskLabel}>Seçilen Görev:</Text>
                <Text style={styles.currentTaskTitle}>{currentTask.title}</Text>
                <View style={styles.currentTaskProgress}>
                  <Text style={styles.currentTaskProgressText}>
                    {currentTask.completedPomodoros}/{currentTask.pomodoroCount} Pomodoro
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={timerStyles.taskCloseButton}
                  onPress={clearCurrentTask}
                >
                  <Ionicons name="close" size={20} color="#FF5722" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

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
        
        <View style={timerStyles.tasksContainer}>
          <View style={styles.tasksPanelHeader}>
            <Text style={styles.tasksPanelTitle}>Tamamlanan Görevler ({completedTasks.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks', { initialFilter: 'completed' as const })}>
              <Text style={styles.seeAllButton}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>
          
          {completedTasks.length > 0 ? (
            <FlatList
              data={completedTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskItem
                  task={item}
                  onPress={() => navigateToTaskDetail(item.id)}
                />
              )}
              style={timerStyles.taskList}
              contentContainerStyle={timerStyles.taskListContent}
              scrollEnabled={false}
              nestedScrollEnabled={false}
            />
          ) : (
            <View style={timerStyles.emptyTasksContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={timerStyles.emptyTasksText}>Bugün tamamlanan görev yok</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TimerScreen;