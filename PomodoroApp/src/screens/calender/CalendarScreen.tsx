import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import TaskCalendar from '../../components/calender/TaskCalender';
import { importEventsAsTasks, requestCalendarPermissions } from '../../services/CalendarService';
import { generateAISchedule } from '../../services/aiScheduler/aiScheduleService';
import { useTask } from '../../context/TaskContext';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import { Task, CreateTaskDTO } from '../../models/Task';

type CalendarScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
  navigation: CalendarScreenNavigationProp;
};

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState(1);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  const { tasks, getTasks, addTask } = useTask();
  
  useEffect(() => {
    checkCalendarAccess();
  }, []);
  
  const checkCalendarAccess = async () => {
    try {
      const hasAccess = await requestCalendarPermissions();
      setHasCalendarAccess(hasAccess);
    } catch (error) {
      console.error('Takvim izni kontrol edilirken hata:', error);
      setHasCalendarAccess(false);
    }
  };
  
  const handleImportCalendarEvents = async () => {
    if (!hasCalendarAccess) {
      const granted = await requestCalendarPermissions();
      if (!granted) {
        Alert.alert(
          'İzin Gerekli',
          'Takvim etkinliklerini içe aktarmak için takvim erişim izni gereklidir.',
          [{ text: 'Tamam' }]
        );
        return;
      }
      setHasCalendarAccess(true);
    }
    
    setIsImporting(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // Bir ay sonrası
      
      const events = await importEventsAsTasks(startDate, endDate);
      
      if (events.length === 0) {
        Alert.alert('Bilgi', 'İçe aktarılacak etkinlik bulunamadı.');
      } else {
        Alert.alert(
          'İçe Aktarma Başarılı',
          `${events.length} etkinlik bulundu. Görev olarak eklemek ister misiniz?`,
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Görevlere Ekle', 
              onPress: () => navigation.navigate('CalendarEventImport', { calendarEvents: events }) 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Etkinlikler içe aktarılırken hata:', error);
      Alert.alert('Hata', 'Takvim etkinlikleri içe aktarılırken bir sorun oluştu.');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleOpenAIModal = () => {
    setStartDate(new Date());
    setSelectedWeeks(1);
    setGeneratedTasks([]);
    setShowAIModal(true);
  };
  
  const handleGenerateAISchedule = async () => {
    setIsGeneratingAI(true);
    try {
      // Geçmiş tamamlanmış görevleri al
      const allTasks = await getTasks();
      const completedTasks = allTasks.filter(task => task.isCompleted);
      
      // Yeterli veri olup olmadığını kontrol et ve kullanıcıya bildir
      if (completedTasks.length < 5) {
        Alert.alert(
          'Sınırlı Veri',
          'En az 1 hafta boyunca çeşitli görevler tamamlarsanız, yapay zeka sizin için daha kişiselleştirilmiş bir çalışma takvimi oluşturabilir. Yine de devam etmek istiyor musunuz?',
          [
            { text: 'İptal', style: 'cancel', onPress: () => setIsGeneratingAI(false) },
            { text: 'Devam Et', onPress: () => generateSchedule(completedTasks) }
          ]
        );
      } else {
        generateSchedule(completedTasks);
      }
    } catch (error) {
      console.error('AI takvim oluşturulurken hata:', error);
      Alert.alert('Hata', 'Yapay zeka takvimi oluşturulurken bir sorun oluştu.');
      setIsGeneratingAI(false);
    }
  };
  
  const generateSchedule = async (completedTasks: Task[]) => {
    try {
      const generatedSchedule = await generateAISchedule({
        completedTasks,
        weeks: selectedWeeks,
        startDate
      });
      
      setGeneratedTasks(generatedSchedule);
    } catch (error) {
      console.error('AI takvim oluşturulurken hata:', error);
      Alert.alert('Hata', 'Yapay zeka takvimi oluşturulurken bir sorun oluştu.');
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  const handleSaveGeneratedTasks = async () => {
    try {
      let savedCount = 0;
      
      for (const task of generatedTasks) {
        const taskData: CreateTaskDTO = {
          title: task.title,
          description: task.description || '',
          date: new Date(task.date),
          pomodoroCount: task.pomodoroCount || 2
        };
        
        await addTask(taskData);
        savedCount++;
      }
      
      Alert.alert(
        'Takvim Kaydedildi',
        `${savedCount} görev başarıyla eklendi.`,
        [{ text: 'Tamam', onPress: () => setShowAIModal(false) }]
      );
    } catch (error) {
      console.error('Görevler kaydedilirken hata:', error);
      Alert.alert('Hata', 'Görevler kaydedilirken bir sorun oluştu.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Takvim</Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={handleOpenAIModal}
          >
            <Ionicons name="flash-outline" size={18} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>AI Takvim</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.importButton}
            onPress={handleImportCalendarEvents}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>İçe Aktar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <TaskCalendar />
      
      {/* AI Çalışma Takvimi Modal */}
      <Modal
        visible={showAIModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Çalışma Takvimi</Text>
              
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {!generatedTasks.length ? (
              <View style={styles.modalContent}>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
                  <Text style={styles.infoText}>
                    Yapay zeka, geçmiş çalışma alışkanlıklarınızı analiz ederek size uygun bir çalışma takvimi oluşturacak.
                  </Text>
                </View>
                
                <Text style={styles.sectionTitle}>Başlangıç Tarihi</Text>
                <View style={styles.dateDisplay}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateText}>
                    {startDate.toLocaleDateString('tr-TR', {
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                
                <Text style={styles.sectionTitle}>Kaç Haftalık Takvim?</Text>
                <View style={styles.weeksSelector}>
                  {[1, 2, 3, 4].map(week => (
                    <TouchableOpacity
                      key={week}
                      style={[
                        styles.weekButton,
                        selectedWeeks === week && styles.selectedWeekButton
                      ]}
                      onPress={() => setSelectedWeeks(week)}
                    >
                      <Text style={[
                        styles.weekButtonText,
                        selectedWeeks === week && styles.selectedWeekButtonText
                      ]}>
                        {week} Hafta
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={handleGenerateAISchedule}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flash-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.generateButtonText}>Takvim Oluştur</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle}>Oluşturulan Takvim</Text>
                <Text style={styles.subtitle}>
                  {selectedWeeks} haftalık, {generatedTasks.length} görev içeren takvim
                </Text>
                
                <ScrollView style={styles.tasksList}>
                  {generatedTasks.map((task, index) => (
                    <View key={index} style={styles.taskItem}>
                      <View style={styles.taskDateContainer}>
                        <Text style={styles.taskDate}>{formatDate(task.date)}</Text>
                      </View>
                      
                      <View style={styles.taskContent}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <Text style={styles.taskDescription}>{task.description}</Text>
                        
                        <View style={styles.pomodoroIndicator}>
                          <Ionicons name="timer-outline" size={14} color="#666" />
                          <Text style={styles.pomodoroText}>
                            {task.pomodoroCount} pomodoro
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setGeneratedTasks([]);
                      setIsGeneratingAI(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Yeniden Oluştur</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveGeneratedTasks}
                  >
                    <Text style={styles.saveButtonText}>Takvimi Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
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
  modalContent: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#0D47A1',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  weeksSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  weekButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedWeekButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  weekButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedWeekButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksList: {
    maxHeight: 350,
  },
  taskItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  taskDateContainer: {
    width: 80,
    paddingRight: 10,
  },
  taskDate: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  pomodoroIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pomodoroText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CalendarScreen;
