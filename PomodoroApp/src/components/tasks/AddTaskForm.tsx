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
  FlatList,
  KeyboardAvoidingView,
  Platform
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
  
  const { getTasks, getTasksByDate } = useTask();
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
      const tasks = await getTasksByDate(selectedDate);
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#5E60CE" />
      
      {/* Başlık çubuğu - mor renkte */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {initialTask ? 'Görevi Düzenle' : 'Yeni Görev'}
        </Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.headerButton}>
          <Ionicons name="checkmark" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Başlık alanı */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={[styles.input, titleError ? styles.inputError : null]}
              value={title}
              onChangeText={setTitle}
              placeholder="Görev başlığı"
              placeholderTextColor="#aaa"
            />
            {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          </View>
          
          {/* Açıklama alanı */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Görev açıklaması (isteğe bağlı)"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          {/* Tarih seçici */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tarih</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={openCalendar}
            >
              <Text style={styles.dateText}>
                {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#5E60CE" />
            </TouchableOpacity>
          </View>
          
          {/* Pomodoro sayacı */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Pomodoro Sayısı</Text>
            <View style={styles.pomodoroContainer}>
              <TouchableOpacity
                style={[styles.pomodoroButton, pomodoroCount <= 1 && styles.disabledButton]}
                onPress={decrementPomodoro}
                disabled={pomodoroCount <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={24} 
                  color={pomodoroCount <= 1 ? "#ccc" : "#5E60CE"} 
                />
              </TouchableOpacity>
              
              <View style={styles.pomodoroCountContainer}>
                <Text style={styles.pomodoroCount}>{pomodoroCount}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.pomodoroButton}
                onPress={incrementPomodoro}
              >
                <Ionicons name="add" size={24} color="#5E60CE" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Takvim Modalı - Düzeltildi */}
      <Modal
        visible={showCalendar}
        animationType="fade"
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
            
            <ScrollView style={styles.calendarContent}>
              {/* Takvim bileşeni */}
              <TaskCalendar 
                onDateSelect={handleCalendarDateSelect}
                hideTaskModal={true}
              />
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.confirmDateButton}
              onPress={confirmDateSelection}
            >
              <Text style={styles.confirmDateButtonText}>Onayla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#5E60CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    minHeight: 100,
    lineHeight: 22,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  pomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pomodoroButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    elevation: 0,
    shadowOpacity: 0,
  },
  pomodoroCountContainer: {
    width: 80,
    alignItems: 'center',
  },
  pomodoroCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarContent: {
    padding: 10,
  },
  confirmDateButton: {
    backgroundColor: '#5E60CE',
    padding: 16,
    alignItems: 'center',
  },
  confirmDateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  completedTaskItem: {
    backgroundColor: '#f0f0f0',
  },
  taskInfo: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
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
});

export default AddTaskForm;
