import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreateTaskDTO, Task } from '../../models/Task';
import { useTask } from '../../context/TaskContext';
import TaskCalendar from '../calender/TaskCalender';

interface AddTaskFormProps {
  onSubmit: (task: CreateTaskDTO) => void;
  onCancel: () => void;
  initialDate?: Date;
  initialTask?: Task;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialDate,
  initialTask 
}) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [date, setDate] = useState(initialTask?.date ? new Date(initialTask.date) : initialDate || new Date());
  const [pomodoroCount, setPomodoroCount] = useState(initialTask?.pomodoroCount || 1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  
  const { getTasks } = useTask();
  const [titleError, setTitleError] = useState('');
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Başlık gereklidir');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    return isValid;
  };
  
  const handleCalendarDateSelect = async (selectedDate: Date) => {
    setSelectedCalendarDate(selectedDate);
    // Seçilen günün görevlerini yükle
    try {
      const tasks = await getTasks(selectedDate);
      setSelectedDateTasks(tasks);
    } catch (error) {
      console.error('Görevler yüklenirken hata oluştu:', error);
      setSelectedDateTasks([]);
    }
  };
  
  const confirmDateSelection = () => {
    if (selectedCalendarDate) {
      setDate(selectedCalendarDate);
    }
    setShowCalendar(false);
  };
  
  const openCalendar = () => {
    setShowCalendar(true);
    setSelectedCalendarDate(date);
    // Mevcut tarihin görevlerini yükle
    handleCalendarDateSelect(date);
  };
  
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const newTask: CreateTaskDTO = {
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      pomodoroCount
    };
    
    onSubmit(newTask);
  };
  
  // Pomodoro sayacını artır/azalt
  const decrementPomodoro = () => {
    if (pomodoroCount > 1) {
      setPomodoroCount(prev => prev - 1);
    }
  };
  
  const incrementPomodoro = () => {
    setPomodoroCount(prev => prev + 1);
  };
  
  // Görev öğesini render et
  const renderTaskItem = ({ item }: { item: Task }) => (
    <View 
      style={[
        styles.taskItem,
        item.isCompleted && styles.completedTaskItem
      ]}
    >
      <View style={styles.taskInfo}>
        <Text style={[
          styles.taskTitle,
          item.isCompleted && styles.completedTaskTitle
        ]}>
          {item.title}
        </Text>
        
        <View style={styles.taskProgress}>
          <Ionicons 
            name="timer-outline" 
            size={14} 
            color="#666" 
            style={{ marginRight: 4 }}
          />
          <Text style={styles.taskProgressText}>
            {item.completedPomodoros}/{item.pomodoroCount}
          </Text>
        </View>
      </View>
      
      {item.isCompleted ? (
        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color="#666" />
      )}
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Turuncu başlık - resimde göründüğü gibi */}
      <View style={styles.orangeHeader}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Görev</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.saveText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          <Text style={styles.label}>Başlık</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            value={title}
            onChangeText={setTitle}
            placeholder="Görev başlığı"
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Görev açıklaması (isteğe bağlı)"
            multiline
            numberOfLines={4}
          />
          
          <Text style={styles.label}>Tarih</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={openCalendar}
          >
            <Text>{date.toLocaleDateString('tr-TR')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.label}>Pomodoro Sayısı</Text>
          <View style={styles.pomodoroContainer}>
            <TouchableOpacity
              style={styles.pomodoroButton}
              onPress={decrementPomodoro}
            >
              <Ionicons name="remove" size={24} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.pomodoroCountContainer}>
              <Text style={styles.pomodoroCount}>{pomodoroCount}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.pomodoroButton}
              onPress={incrementPomodoro}
            >
              <Ionicons name="add" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Tarih Seç</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarContentContainer}>
              <TaskCalendar 
                onDateSelect={handleCalendarDateSelect}
                hideTaskModal={true}
              />
              
              {selectedCalendarDate && (
                <View style={styles.selectedDateContainer}>
                  <Text style={styles.selectedDateTitle}>
                    {selectedCalendarDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  
                  <View style={styles.taskListContainer}>
                    {selectedDateTasks.length > 0 ? (
                      <FlatList
                        data={selectedDateTasks}
                        renderItem={renderTaskItem}
                        keyExtractor={item => item.id}
                        style={styles.tasksList}
                      />
                    ) : (
                      <Text style={styles.noTasksText}>Bu günde görev yok</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={confirmDateSelection}
                  >
                    <Text style={styles.confirmButtonText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  orangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FF5722', // Turuncu renk
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 36, // Status bar için ek padding
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    marginTop: -12,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  pomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pomodoroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pomodoroCountContainer: {
    width: 60,
    alignItems: 'center',
  },
  pomodoroCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '85%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarContentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  selectedDateContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskListContainer: {
    maxHeight: 150,
    marginBottom: 16,
  },
  tasksList: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  noTasksText: {
    padding: 16,
    color: '#999',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  completedTaskItem: {
    opacity: 0.7,
  },
  taskInfo: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskProgressText: {
    fontSize: 12,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddTaskForm;
