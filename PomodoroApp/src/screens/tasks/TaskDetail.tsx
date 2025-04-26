import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootScreenProps } from '../../navigation/navigationTypes';
import { useTask } from '../../context/TaskContext';
import { useTimer } from '../../context/TimerContext';
import { Task } from '../../models/Task';

type Props = RootScreenProps<'TaskDetail'>;

const TaskDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { taskId } = route.params;
  const { getTaskById, toggleTaskCompletion, deleteTask } = useTask();
  const { startTimerWithTask } = useTimer();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTask();
  }, [taskId]);
  
  const loadTask = async () => {
    setLoading(true);
    try {
      const fetchedTask = await getTaskById(taskId);
      if (fetchedTask) {
        setTask(fetchedTask);
      } else {
        Alert.alert('Hata', 'Görev bulunamadı');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Görev yüklenirken hata oluştu:', error);
      Alert.alert('Hata', 'Görev yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleCompletion = async () => {
    if (!task) return;
    
    try {
      const updatedTask = await toggleTaskCompletion(task.id);
      setTask(updatedTask);
    } catch (error) {
      console.error('Görev durumu değiştirilirken hata oluştu:', error);
      Alert.alert('Hata', 'Görev durumu değiştirilirken bir hata oluştu');
    }
  };
  
  const handleStartTimer = () => {
    if (!task) return;
    startTimerWithTask(task);
    
    navigation.navigate('MainTabs', { screen: 'Timer' });
  };
  
  const handleDelete = () => {
    if (!task) return;
    
    Alert.alert(
      'Görevi Sil',
      'Bu görevi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              Alert.alert('Başarılı', 'Görev silindi');
              navigation.goBack();
            } catch (error) {
              console.error('Görev silinirken hata oluştu:', error);
              Alert.alert('Hata', 'Görev silinirken bir hata oluştu');
            }
          } 
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }
  
  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text>Görev bulunamadı.</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.title,
            task.isCompleted && styles.completedTitle
          ]}>
            {task.title}
          </Text>
          
          <TouchableOpacity
            style={styles.completionButton}
            onPress={handleToggleCompletion}
          >
            {task.isCompleted ? (
              <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            ) : (
              <Ionicons name="ellipse-outline" size={28} color="#666" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>
              {new Date(task.date).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          
          {task.dueDate && (
            <View style={styles.dateItem}>
              <Ionicons name="flag-outline" size={16} color="#666" />
              <Text style={styles.dateText}>
                Son Tarih: {new Date(task.dueDate).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {task.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pomodoro İlerleme</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, (task.completedPomodoros / task.pomodoroCount) * 100)}%`,
                  backgroundColor: task.isCompleted ? '#4CAF50' : '#FF5722' 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {task.completedPomodoros}/{task.pomodoroCount} Pomodoro
          </Text>
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.timerButton]}
          onPress={handleStartTimer}
        >
          <Ionicons name="timer-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Pomodoro Başlat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Düzenle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  completionButton: {
    padding: 5,
  },
  dateContainer: {
    marginTop: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    lineHeight: 22,
    color: '#444',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF5722',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  buttonsContainer: {
    padding: 20,
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  timerButton: {
    backgroundColor: '#FF5722',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
});

export default TaskDetailScreen;