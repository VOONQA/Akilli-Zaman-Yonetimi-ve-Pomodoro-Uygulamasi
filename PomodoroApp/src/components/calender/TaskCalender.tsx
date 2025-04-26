import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTask } from '../../context/TaskContext';
import { Task, CreateTaskDTO } from '../../models/Task';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import AICalendarGenerator from './AICalendarGenerator';

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

interface TaskCalendarProps {
  onDateSelect?: (date: Date) => void;
  hideTaskModal?: boolean;
  onClose?: () => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ onDateSelect, hideTaskModal, onClose }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { getTasks, getTasksByDate, getTasksByDateRange, addTask } = useTask();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date | null, isCurrentMonth: boolean }>>([]);
  const [monthTasks, setMonthTasks] = useState<Task[]>([]);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isProcessingPress, setIsProcessingPress] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  
  // Ay ve yıl bilgilerini al
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Takvim verilerini hazırla
  const generateCalendarDays = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const days: Array<{ date: Date | null, isCurrentMonth: boolean }> = [];
    
    // Önceki ayın günlerini ekle
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
    for (let i = 0; i < firstDayOfMonth; i++) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Mevcut ayın günlerini ekle
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Sonraki ayın günlerini ekle (6 satır tamamlamak için)
    const remainingDays = 42 - days.length; // 6 satır x 7 gün = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    setCalendarDays(days);
  }, [currentYear, currentMonth]);
  
  // Ay değiştirme işlemleri
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };
  
  // Ayın görevlerini yükle
  const loadMonthTasks = useCallback(async () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const tasks = await getTasksByDateRange(firstDayOfMonth, lastDayOfMonth);
    setMonthTasks(tasks);
  }, [currentYear, currentMonth, getTasksByDateRange]);
  
  // Seçilen günün görevlerini yükle
  const loadSelectedDayTasks = useCallback(async () => {
    if (!selectedDate) return;
    
    try {
      const dateOnly = new Date(selectedDate);
      dateOnly.setHours(0, 0, 0, 0);
      
      const tasks = await getTasksByDate(dateOnly);
      
      setSelectedDayTasks(tasks);
    } catch (error) {
      setSelectedDayTasks([]);
    }
  }, [selectedDate, getTasksByDate]);
  
  // Tarih seçildiğinde
  const handleDayPress = (date: Date | null) => {
    if (!date || isProcessingPress) return;
    
    setIsProcessingPress(true);
    
    // Seçili tarihi güncelle
    setSelectedDate(date);
    
    if (onDateSelect) {
      onDateSelect(date);
      setIsProcessingPress(false);
      return;
    }
    
    if (hideTaskModal) {
      setIsProcessingPress(false);
      return;
    }
    
    const startDay = new Date(date);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(date);
    endDay.setHours(23, 59, 59, 999);
    
    // Kısa bir gecikme ile işlemi yap (debounce)
    setTimeout(() => {
      getTasksByDateRange(startDay, endDay)
        .then(tasks => {
          setSelectedDayTasks(tasks);
          setShowTaskModal(true);
        })
        .catch(() => {
          setSelectedDayTasks([]);
          setShowTaskModal(true);
        })
        .finally(() => {
          setIsProcessingPress(false);
        });
    }, 300);
  };
  
  // Takvim oluşturulduğunda ve ay değiştiğinde
  useEffect(() => {
    generateCalendarDays();
    loadMonthTasks();
  }, [currentYear, currentMonth, generateCalendarDays, loadMonthTasks]);
  
  // Gün seçildiğinde
  useEffect(() => {
    if (selectedDate) {
      loadSelectedDayTasks();
    }
  }, [selectedDate, loadSelectedDayTasks]);
  
  // Bir günde görev olup olmadığını kontrol et
  const getTasksForDay = useCallback((date: Date | null) => {
    if (!date) return [];
    
    const dateString = date.toDateString();
    return monthTasks.filter(task => 
      new Date(task.date).toDateString() === dateString);
  }, [monthTasks]);
  
  // Günün rengini belirle (görev durumuna göre)
  const getDayColor = (date: Date | null) => {
    if (!date) return {};
    
    const tasks = getTasksForDay(date);
    if (tasks.length === 0) return {};
    
    const hasIncompleteTask = tasks.some(task => !task.isCompleted);
    return { backgroundColor: hasIncompleteTask ? '#FFF3E0' : '#E8F5E9' };
  };
  
  // Bugünün tarihini kontrol et
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // Seçilen tarihi kontrol et
  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };
  
  const renderWeekdayHeader = () => {
    const weekdays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    
    return (
      <View style={styles.weekdayHeader}>
        {weekdays.map((day, index) => (
          <Text key={index} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
    );
  };
  
  // AI Takvim modalını aç
  const handleOpenAIModal = async () => {
    try {
      // Tamamlanmış görevleri al
      const allTasks = await getTasks();
      setCompletedTasks(allTasks.filter(task => task.isCompleted));
      setShowAIModal(true);
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
    }
  };
  
  // AI Takvim'den gelen görevleri kaydet
  const handleSaveAITasks = async (tasks: CreateTaskDTO[]) => {
    try {
      for (const task of tasks) {
        await addTask(task);
      }
      loadMonthTasks(); // Takvimi yenile
    } catch (error) {
      console.error('Görevler kaydedilirken hata:', error);
    }
  };
  
  // Görev modalı tamamen değiştir - çok basit ve güvenilir bir versiyonu kullan
  const renderTaskModal = () => {
    // Eğer seçili tarih veya görevler henüz yüklenmediyse modal gösterme
    if (!selectedDate || !selectedDayTasks) return null;
    
    // Eğer modal gösterilmeyecekse erken dön
    if (!showTaskModal) return null;
    
    const formattedDate = selectedDate.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    return (
      <Modal
        transparent={true}
        visible={showTaskModal}
        animationType="slide"
        onRequestClose={() => {
          setShowTaskModal(false);
          // Rate limiti sıfırla
          setTimeout(() => setIsProcessingPress(false), 500);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formattedDate}</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedDayTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Bu günde görev yok</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setShowTaskModal(false);
                    navigation.navigate('EditTask', { 
                      taskId: undefined,
                      initialDateString: selectedDate.toISOString()
                    });
                    if (onClose) onClose();
                  }}
                >
                  <Text style={styles.addButtonText}>Görev Ekle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{padding: 16}}>
                {selectedDayTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskItem,
                      task.isCompleted && styles.completedTaskItem
                    ]}
                    onPress={() => {
                      setShowTaskModal(false);
                      navigation.navigate('TaskDetail', { taskId: task.id });
                      if (onClose) onClose();
                    }}
                  >
                    <View style={styles.taskItemContent}>
                      <Text style={[
                        styles.taskItemTitle,
                        task.isCompleted && styles.completedTaskTitle
                      ]}>
                        {task.title}
                      </Text>
                      
                      <View style={styles.taskProgress}>
                        <Ionicons name="timer-outline" size={14} color="#666" />
                        <Text style={styles.taskProgressText}>
                          {task.completedPomodoros}/{task.pomodoroCount}
                        </Text>
                      </View>
                    </View>
                    
                    {task.isCompleted ? (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    ) : (
                      <Ionicons name="ellipse-outline" size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setShowTaskModal(false);
                    navigation.navigate('EditTask', { 
                      taskId: undefined,
                      initialDateString: selectedDate.toISOString()
                    });
                    if (onClose) onClose();
                  }}
                >
                  <Text style={styles.addButtonText}>Görev Ekle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };
  
  // Takvimi 300ms sonra resetle (render sorunu için)
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      setCurrentDate(new Date());
    }, 300);
    
    return () => clearTimeout(resetTimer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.monthYearButton} onPress={goToToday}>
          <Text style={styles.monthYearText}>
            {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextMonth}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.toolbarContainer}>
        <TouchableOpacity 
          style={styles.aiButton}
          onPress={handleOpenAIModal}
        >
          <Ionicons name="flash-outline" size={18} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>AI Takvim</Text>
        </TouchableOpacity>
      </View>
      
      {renderWeekdayHeader()}
      
      <View style={styles.calendarGrid}>
        {calendarDays.map((dayInfo, index) => {
          // Günün görevlerini hesapla 
          const taskCount = dayInfo.date ? getTasksForDay(dayInfo.date).length : 0;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.day,
                !dayInfo.isCurrentMonth && styles.outsideMonthDay,
                isToday(dayInfo.date) && styles.todayDay,
                isSelected(dayInfo.date) && styles.selectedDay,
                getDayColor(dayInfo.date)
              ]}
              onPress={() => handleDayPress(dayInfo.date)}
              disabled={!dayInfo.date || isProcessingPress}
            >
              <Text style={[
                styles.dayText,
                !dayInfo.isCurrentMonth && styles.outsideMonthDayText,
                isToday(dayInfo.date) && styles.todayDayText,
                isSelected(dayInfo.date) && styles.selectedDayText
              ]}>
                {dayInfo.date?.getDate()}
              </Text>
              
              {dayInfo.date && taskCount > 0 && (
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>
                    {taskCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Task Modalı */}
      {renderTaskModal()}
      
      {/* AI Takvim Oluşturma Bileşeni */}
      <AICalendarGenerator
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onTasksGenerated={handleSaveAITasks}
        completedTasks={completedTasks}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthYearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  weekdayHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f0f0f0',
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  outsideMonthDay: {
    backgroundColor: '#f9f9f9',
  },
  outsideMonthDayText: {
    color: '#ccc',
  },
  todayDay: {
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  todayDayText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  selectedDay: {
    backgroundColor: '#FF5722',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dayBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  dayBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  completedTaskItem: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F5F5F5',
  },
  taskItemContent: {
    flex: 1,
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskProgressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  toolbarContainer: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  }
});

// React.memo ile sarmalayarak gereksiz render'ları önlüyoruz
export default React.memo(TaskCalendar);
