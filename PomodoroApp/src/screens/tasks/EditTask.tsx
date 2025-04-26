import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
  Button,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootScreenProps } from '../../navigation/navigationTypes';
import { useTask } from '../../context/TaskContext';
import { Task, CreateTaskDTO } from '../../models/Task';
import { useTimer } from '../../context/TimerContext';
import { AddTaskForm } from '../../components/tasks';
import { styles as screenStyles } from './styles';

type Props = RootScreenProps<'EditTask'>;

const EditTaskScreen: React.FC<Props> = ({ route, navigation }) => {
  const { taskId, initialDate, initialDateString } = route.params || {};
  const { getTaskById, addTask, updateTask, deleteTask } = useTask();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Eğer initialDateString varsa onu kullan, yoksa initialDate'i kullan
  const effectiveInitialDate = initialDateString 
    ? new Date(initialDateString) 
    : initialDate;
  
  // Düzenleme modunda görev verilerini yükle
  useEffect(() => {
    const loadTask = async () => {
      if (taskId) {
        setLoading(true);
        try {
          const task = await getTaskById(taskId);
          if (task) {
            setTask(task);
          } else {
            Alert.alert('Hata', 'Görev bulunamadı');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Görev yüklenirken hata oluştu:', error);
          Alert.alert('Hata', 'Görev yüklenirken bir hata oluştu.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadTask();
  }, [taskId, getTaskById, navigation]);
  
  const handleSubmit = async (formData: CreateTaskDTO) => {
    setLoading(true);
    try {
      if (task && taskId) {
        await updateTask(taskId, formData);
        Alert.alert('Başarılı', 'Görev güncellendi', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      } else {
        await addTask(formData);
        Alert.alert('Başarılı', 'Görev oluşturuldu', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Görev kaydedilirken hata oluştu:', error);
      Alert.alert('Hata', 'Görev kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = () => {
    if (!task || !taskId) return;
    
    Alert.alert(
      'Görevi Sil',
      'Bu görevi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteTask(taskId);
              Alert.alert('Başarılı', 'Görev silindi', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Görev silinirken hata oluştu:', error);
              Alert.alert('Hata', 'Görev silinirken bir hata oluştu');
              setLoading(false);
            }
          } 
        }
      ]
    );
  };
  
  // Görev silindiğinde silme butonunu göster
  const renderDeleteButton = () => {
    if (!task || !taskId) return null;
    
    return (
      <TouchableOpacity
        style={[screenStyles.button, screenStyles.deleteButton]}
        onPress={handleDelete}
        disabled={loading}
      >
        <Text style={screenStyles.deleteButtonText}>Görevi Sil</Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={screenStyles.container}>
      <AddTaskForm
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        initialDate={effectiveInitialDate || (task ? new Date(task.date) : new Date())}
        initialTask={task || undefined}
      />
      
      {renderDeleteButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 8,
    marginTop: -8,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF5722',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default EditTaskScreen;