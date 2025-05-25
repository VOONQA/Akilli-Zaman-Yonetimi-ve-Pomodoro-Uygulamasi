import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, StyleSheet, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../../navigation/navigationTypes';
import { useTask } from '../../context/TaskContext';
import { Task } from '../../models/Task';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './styles';
import { TaskList } from '../../components/tasks';
import TaskCalendar from '../../components/calender/TaskCalender';
import { TAB_BAR_HEIGHT } from '../../navigation/TabNavigator';

type Props = TabScreenProps<'Tasks'>;

const TasksScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialFilter = route.params?.initialFilter || 'all';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>(
    initialFilter as 'all' | 'today' | 'upcoming' | 'completed'
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<{[key: string]: boolean}>({});
  const [selectionMode, setSelectionMode] = useState(false);
  
  const { getTasks, toggleTaskCompletion, deleteTask, lastUpdate } = useTask();
  
  // Ekran odaklandığında görevleri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      loadTasks();
      // Seçim modunu sıfırla
      setSelectionMode(false);
      setSelectedTasks({});
    }, [activeFilter])
  );
  
  const loadTasks = async () => {
    setLoading(true);
    try {
      let fetchedTasks: Task[] = [];
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const allTasks = await getTasks();
      
      switch (activeFilter) {
        case 'today':
          fetchedTasks = allTasks.filter(task => 
            new Date(task.date).toDateString() === now.toDateString());
          break;
        case 'upcoming':
          fetchedTasks = allTasks.filter(task => 
            new Date(task.date) > now && !task.isCompleted);
          break;
        case 'completed':
          fetchedTasks = allTasks.filter(task => task.isCompleted);
          break;
        default:
          fetchedTasks = allTasks.filter(task => !task.isCompleted);
      }
      
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Görevler yüklenirken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // TaskDetail sayfasına navigasyon
  const navigateToTaskDetail = (taskId: string) => {
    setShowCalendar(false); // Takvimi kapat
    navigation.navigate('TaskDetail', { taskId });
  };

  // EditTask sayfasına navigasyon
  const navigateToEditTask = (taskId?: string, initialDate?: Date) => {
    setShowCalendar(false); // Takvimi kapat
    navigation.navigate('EditTask', { taskId, initialDate });
  };
  
  const handleTaskPress = (taskId: string) => {
    navigateToTaskDetail(taskId);
  };
  
  const handleToggleComplete = async (taskId: string) => {
    try {
      // API çağrısı yapılıyor
      await toggleTaskCompletion(taskId);
      
      // Liste hemen yenileniyor
      loadTasks();
    } catch (error) {
      console.error('Görev durumu değiştirilirken hata oluştu:', error);
    }
  };
  
  // Takvim modalını aç/kapat
  const toggleCalendarModal = () => {
    setShowCalendar(!showCalendar);
  };
  
  const getEmptyMessage = () => {
    switch (activeFilter) {
      case 'all':
        return 'Hiç görev bulunamadı';
      case 'today':
        return 'Bugün görev bulunamadı';
      case 'upcoming':
        return 'Yaklaşan görev bulunamadı';
      case 'completed':
        return 'Tamamlanan görev bulunamadı';
      default:
        return 'Hiç görev bulunamadı';
    }
  };
  
  // Toplu seçme fonksiyonları
  const activateSelectionMode = (taskId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedTasks({ [taskId]: true });
    }
  };
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  // Seçim modundan çıkma
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedTasks({});
  };
  
  const handleDeleteSelected = async () => {
    const selectedTaskIds = Object.keys(selectedTasks).filter(id => selectedTasks[id]);
    
    if (selectedTaskIds.length === 0) {
      return;
    }
    
    Alert.alert(
      'Görevleri Sil',
      `${selectedTaskIds.length} görevi silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              for (const taskId of selectedTaskIds) {
                await deleteTask(taskId);
              }
              
              // Seçim modunu kapat ve listeyi yenile
              exitSelectionMode();
              loadTasks();
            } catch (error) {
              console.error('Görevler silinirken hata oluştu:', error);
              Alert.alert('Hata', 'Görevler silinirken bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };
  
  // lastUpdate değiştiğinde görevleri yenile
  useEffect(() => {
    loadTasks();
  }, [activeFilter, lastUpdate]);
  
  // navigasyondan dönüşte görevleri yeniden yükle
  // Focus effect zaten var, ama TaskDetail'den döndüğümüzde de çalışıyor mu kontrol edelim
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });

    return unsubscribe;
  }, [navigation]);
  
  // Swipe gesture
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 30;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        // Sağa kaydır - Timer'a git
        navigation.navigate('Timer');
      } else if (gestureState.dx < -50) {
        // Sola kaydır - Statistics'e git
        navigation.navigate('Statistics');
      }
    },
  });
  
  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <View style={styles.container}>
        <View style={styles.header}>
          {selectionMode ? (
            <>
              <TouchableOpacity 
                style={newStyles.closeButton}
                onPress={exitSelectionMode}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.title}>
                {Object.values(selectedTasks).filter(v => v).length} seçildi
              </Text>
              
              <TouchableOpacity 
                style={newStyles.deleteButton}
                onPress={handleDeleteSelected}
                disabled={Object.values(selectedTasks).filter(v => v).length === 0}
              >
                <Ionicons name="trash" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Görevler</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigateToEditTask()}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
              Tümü
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'today' && styles.activeFilter]}
            onPress={() => setActiveFilter('today')}
          >
            <Text style={[styles.filterText, activeFilter === 'today' && styles.activeFilterText]}>
              Bugün
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'upcoming' && styles.activeFilter]}
            onPress={() => setActiveFilter('upcoming')}
          >
            <Text style={[styles.filterText, activeFilter === 'upcoming' && styles.activeFilterText]}>
              Yaklaşan
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, activeFilter === 'completed' && styles.activeFilter]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}>
              Tamamlanan
            </Text>
          </TouchableOpacity>
        </View>
        
        <TaskList
          tasks={tasks}
          loading={loading}
          onTaskPress={selectionMode ? toggleTaskSelection : handleTaskPress}
          emptyMessage={getEmptyMessage()}
          selectionMode={selectionMode}
          selectedTasks={selectedTasks}
          onToggleSelection={activateSelectionMode}
        />
        
        {/* Sağ alt köşedeki takvim butonu */}
        <TouchableOpacity
          style={styles.floatingCalendarButton}
          onPress={toggleCalendarModal}
        >
          <Ionicons name="calendar" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Takvim Modal */}
        <Modal
          visible={showCalendar}
          animationType="slide"
          transparent={true}
          onRequestClose={toggleCalendarModal}
        >
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarModalContent}>
              <View style={styles.calendarModalHeader}>
                <Text style={styles.calendarModalTitle}>Takvim</Text>
                <TouchableOpacity onPress={toggleCalendarModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <TaskCalendar onClose={toggleCalendarModal} />
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

// Yeni stiller için ayrı bir StyleSheet tanımladım
const newStyles = StyleSheet.create({
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 8,
  },
});

export default TasksScreen;