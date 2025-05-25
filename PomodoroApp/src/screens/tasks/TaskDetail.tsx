import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar
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
        <ActivityIndicator size="large" color="#5E60CE" />
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5E60CE" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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
                <Ionicons name="ellipse-outline" size={28} color="#5E60CE" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color="#5E60CE" />
              <Text style={styles.infoText}>
                {new Date(task.date).toLocaleDateString('tr-TR')}
              </Text>
            </View>
            
            {task.dueDate && (
              <View style={styles.infoItem}>
                <Ionicons name="flag-outline" size={18} color="#5E60CE" />
                <Text style={styles.infoText}>
                  {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Pomodoro İlerleme</Text>
              <Text style={styles.progressCount}>
                {task.completedPomodoros}/{task.pomodoroCount}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, (task.completedPomodoros / task.pomodoroCount) * 100)}%`,
                    backgroundColor: task.isCompleted ? '#4CAF50' : '#5E60CE' 
                  }
                ]} 
              />
            </View>
          </View>
          
          {task.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Açıklama</Text>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.timerButton]}
          onPress={handleStartTimer}
        >
          <Ionicons name="play-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Başlat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditTask', { taskId: task.id })}
        >
          <Ionicons name="create" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  completionButton: {
    padding: 6,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
    backgroundColor: '#f0f2f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  infoText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5E60CE',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5E60CE',
    borderRadius: 4,
  },
  descriptionSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    lineHeight: 22,
    color: '#555',
    fontSize: 15,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  timerButton: {
    backgroundColor: '#5E60CE',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
});

export default TaskDetailScreen;