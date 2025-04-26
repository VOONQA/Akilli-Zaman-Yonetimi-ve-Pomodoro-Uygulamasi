import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, CreateTaskDTO } from '../../models/Task';
import { generateAISchedule } from '../../services/aiScheduler/aiScheduleService';

interface AICalendarGeneratorProps {
  visible: boolean;
  onClose: () => void;
  onTasksGenerated: (tasks: CreateTaskDTO[]) => Promise<void>;
  completedTasks: Task[];
}

const AICalendarGenerator: React.FC<AICalendarGeneratorProps> = ({ 
  visible, 
  onClose, 
  onTasksGenerated,
  completedTasks 
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState(1);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  // Düzenlenebilir görevler için state'ler
  const [editableGeneratedTasks, setEditableGeneratedTasks] = useState<any[]>([]);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number>(-1);
  
  // Görev kaydı için state'ler
  const [isSaving, setIsSaving] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Düzenleme için yeni state
  const [editingTask, setEditingTask] = useState<any>(null);
  
  // Modal açıldığında her şeyi sıfırla
  useEffect(() => {
    if (visible) {
      setStartDate(new Date());
      setSelectedWeeks(1);
      setShowResultModal(false); 
    }
  }, [visible]);
  
  // AI takvimi oluşturulduğunda düzenlenebilir kopyasını oluştur
  const handleGenerateAISchedule = async () => {
    setIsGeneratingAI(true);
    try {
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
      Alert.alert('Hata', 'Yapay zeka takvimi oluşturulurken bir sorun oluştu.');
      setIsGeneratingAI(false);
    }
  };
  
  // AI Schedule oluşturma
  const generateSchedule = async (completedTasks: Task[]) => {
    try {
      // Dolu veya boş olsun, bir şekilde örnek veri oluştur
      let generatedSchedule = [];
      
      if (completedTasks.length > 0) {
        generatedSchedule = await generateAISchedule({
          completedTasks,
          weeks: selectedWeeks,
          startDate
        });
      } else {
        // Örnek veri oluştur (tamamlanmış görev yoksa)
        const sampleTasks = [
          {
            title: "Matematik Çalışması",
            description: "Türev konusunu çalış",
            date: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            pomodoroCount: 2
          },
          {
            title: "Fizik Çalışması",
            description: "Dalga mekaniği konusunu çalış",
            date: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            pomodoroCount: 3
          },
          {
            title: "Türkçe Çalışması",
            description: "Paragraf çözümü yap",
            date: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            pomodoroCount: 2
          }
        ];
        generatedSchedule = sampleTasks;
      }
      
      setGeneratedTasks(generatedSchedule);
      setEditableGeneratedTasks([...generatedSchedule]);
      
      // AI Takvim oluşturma modalını kapat, sonuç modalını göster
      onClose();
      setShowResultModal(true);
    } catch (error) {
      Alert.alert('Hata', 'Yapay zeka takvimi oluşturulurken bir sorun oluştu.');
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  // Takvimi kaydet
  const handleSaveGeneratedTasks = async () => {
    setIsSaving(true);
    try {
      if (editableGeneratedTasks.length === 0) {
        Alert.alert('Hata', 'Kaydedilecek görev bulunamadı.');
        setIsSaving(false);
        return;
      }
      
      const tasksToAdd: CreateTaskDTO[] = editableGeneratedTasks.map(task => ({
        title: task.title,
        description: task.description || '',
        date: new Date(task.date),
        pomodoroCount: task.pomodoroCount || 2
      }));
      
      await onTasksGenerated(tasksToAdd);
      
      Alert.alert(
        'Takvim Kaydedildi',
        `${tasksToAdd.length} görev başarıyla eklendi.`,
        [{ text: 'Tamam', onPress: () => {
          resetState();
        }}]
      );
    } catch (error) {
      Alert.alert('Hata', 'Görevler kaydedilirken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Tüm state'leri resetle
  const resetState = () => {
    setShowResultModal(false);
    setEditableGeneratedTasks([]);
    setGeneratedTasks([]);
    setEditingTaskIndex(-1);
    setSelectedWeeks(1);
    setStartDate(new Date());
  };
  
  // Görevleri düzenlemeye başla
  const startEditingTask = (index: number) => {
    // Task bilgilerini editingTask'a kopyala
    setEditingTask({...editableGeneratedTasks[index], index});
    setEditingTaskIndex(index);
  };
  
  // Düzenlemeyi bitir
  const finishEditing = () => {
    if (editingTask) {
      // Değişiklikleri ana listeye kaydet
      const updatedTasks = [...editableGeneratedTasks];
      updatedTasks[editingTask.index] = {
        title: editingTask.title,
        description: editingTask.description,
        date: editingTask.date,
        pomodoroCount: editingTask.pomodoroCount
      };
      setEditableGeneratedTasks(updatedTasks);
    }
    
    // Düzenleme modunu kapat
    setEditingTask(null);
    setEditingTaskIndex(-1);
  };
  
  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };
  
  // TaskItem için interface oluştur
  interface TaskItemProps {
    item: {
      title: string;
      description: string;
      date: string;
      pomodoroCount: number;
    };
    index: number;
    isEditing: boolean;
    onPress: () => void;
    onChangeTitle: (text: string) => void;
    onChangeDescription: (text: string) => void;
    onPomodoroDecrease: () => void;
    onPomodoroIncrease: () => void;
    onFinishEditing: () => void;
  }

  // Task öğesi için memo kullanarak performansı artıralım
  const TaskItem = React.memo<TaskItemProps>(
    ({ item, index, isEditing, onPress, onChangeTitle, onChangeDescription, onPomodoroDecrease, onPomodoroIncrease, onFinishEditing }) => {
      return (
        <TouchableOpacity 
          style={[
            styles.aiTaskItem,
            isEditing && styles.editingTaskItem
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.taskDateContainer}>
            <Text style={styles.taskDate}>{formatDate(item.date)}</Text>
          </View>
          
          <View style={styles.taskContent}>
            <Text style={styles.taskItemTitle}>{item.title}</Text>
            <Text style={styles.taskDescription}>{item.description}</Text>
            
            <View style={styles.pomodoroIndicator}>
              <Ionicons name="timer-outline" size={14} color="#666" />
              <Text style={styles.pomodoroText}>
                {item.pomodoroCount} pomodoro
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    (prevProps, nextProps) => {
      return (
        prevProps.isEditing === nextProps.isEditing &&
        prevProps.item.title === nextProps.item.title &&
        prevProps.item.description === nextProps.item.description &&
        prevProps.item.pomodoroCount === nextProps.item.pomodoroCount
      );
    }
  );
  
  return (
    <>
      {/* AI Takvim Oluşturma Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiModalContainer}>
            <View style={styles.aiModalHeader}>
              <Text style={styles.aiModalTitle}>AI Çalışma Takvimi</Text>
              
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.aiModalContent} contentContainerStyle={{paddingBottom: 20}}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Oluşturulan Takvim Sonuç Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowResultModal(false);
          setEditingTaskIndex(-1);
        }}
      >
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>AI Çalışma Takvimi</Text>
            
            <TouchableOpacity onPress={() => {
              setShowResultModal(false);
              setEditingTaskIndex(-1);
            }}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.resultContent}>
            <Text style={styles.sectionTitle}>Oluşturulan Takvim</Text>
            <Text style={styles.subtitle}>
              {selectedWeeks} haftalık, {editableGeneratedTasks.length} görev
            </Text>
            <Text style={styles.editHint}>
              <Ionicons name="information-circle-outline" size={14} color="#2196F3" />
              {' '}Düzenlemek için görevlere tıklayabilirsiniz.
            </Text>
            
            {editableGeneratedTasks.length > 0 ? (
              <FlatList
                data={editableGeneratedTasks}
                keyExtractor={(_, index) => index.toString()}
                style={styles.taskList}
                contentContainerStyle={{padding: 16}}
                removeClippedSubviews={true}
                initialNumToRender={5}
                maxToRenderPerBatch={2}
                windowSize={3}
                updateCellsBatchingPeriod={100}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TaskItem
                    item={item}
                    index={index}
                    isEditing={editingTaskIndex === index}
                    onPress={() => startEditingTask(index)}
                    onChangeTitle={(text) => {
                      const updatedTasks = [...editableGeneratedTasks];
                      updatedTasks[index] = {
                        ...updatedTasks[index],
                        title: text
                      };
                      setEditableGeneratedTasks(updatedTasks);
                    }}
                    onChangeDescription={(text) => {
                      const updatedTasks = [...editableGeneratedTasks];
                      updatedTasks[index] = {
                        ...updatedTasks[index],
                        description: text
                      };
                      setEditableGeneratedTasks(updatedTasks);
                    }}
                    onPomodoroDecrease={() => {
                      if (editingTaskIndex === index) {
                        const updatedTasks = [...editableGeneratedTasks];
                        updatedTasks[index].pomodoroCount = Math.max(1, item.pomodoroCount - 1);
                        setEditableGeneratedTasks(updatedTasks);
                      }
                    }}
                    onPomodoroIncrease={() => {
                      if (editingTaskIndex === index) {
                        const updatedTasks = [...editableGeneratedTasks];
                        updatedTasks[index].pomodoroCount = Math.min(4, item.pomodoroCount + 1);
                        setEditableGeneratedTasks(updatedTasks);
                      }
                    }}
                    onFinishEditing={finishEditing}
                  />
                )}
              />
            ) : (
              <View style={styles.emptyTaskContainer}>
                <Text style={styles.emptyTaskText}>Henüz görev oluşturulmadı</Text>
              </View>
            )}
          </View>
          
          {/* Ekranın en altına sabit butonlar */}
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButtonStyle]}
              onPress={() => {
                Alert.alert(
                  'Takvimi Reddet',
                  'Oluşturulan takvimi reddetmek istiyor musunuz?',
                  [
                    { text: 'Vazgeç', style: 'cancel' },
                    { 
                      text: 'Reddet', 
                      onPress: resetState,
                      style: 'destructive' 
                    }
                  ]
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Reddet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButtonStyle]}
              onPress={handleSaveGeneratedTasks}
              disabled={isSaving || editableGeneratedTasks.length === 0}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Onayla ve Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Görev Düzenleme Modalı */}
      <Modal
        visible={editingTask !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={finishEditing}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editModalOverlay}
        >
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Görevi Düzenle</Text>
              <TouchableOpacity onPress={finishEditing}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {editingTask && (
              <View style={styles.editModalContent}>
                <Text style={styles.editModalLabel}>Görev Başlığı</Text>
                <TextInput
                  style={styles.editModalInput}
                  value={editingTask.title}
                  onChangeText={(text) => setEditingTask({...editingTask, title: text})}
                  placeholder="Görev başlığı"
                />
                
                <Text style={styles.editModalLabel}>Açıklama</Text>
                <TextInput
                  style={styles.editModalTextarea}
                  value={editingTask.description}
                  onChangeText={(text) => setEditingTask({...editingTask, description: text})}
                  placeholder="Görev açıklaması"
                  multiline={true}
                />
                
                <Text style={styles.editModalLabel}>Pomodoro Sayısı</Text>
                <View style={styles.editModalPomodoroContainer}>
                  <TouchableOpacity 
                    style={styles.editModalPomodoroButton}
                    onPress={() => setEditingTask({
                      ...editingTask, 
                      pomodoroCount: Math.max(1, editingTask.pomodoroCount - 1)
                    })}
                  >
                    <Ionicons name="remove" size={18} color="#666" />
                  </TouchableOpacity>
                  
                  <Text style={styles.editModalPomodoroCount}>
                    {editingTask.pomodoroCount}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.editModalPomodoroButton}
                    onPress={() => setEditingTask({
                      ...editingTask, 
                      pomodoroCount: Math.min(4, editingTask.pomodoroCount + 1)
                    })}
                  >
                    <Ionicons name="add" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.editModalSaveButton}
                  onPress={finishEditing}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.editModalSaveButtonText}>Değişiklikleri Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // AI Modal Stilleri
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    height: 500,
    maxHeight: '90%',
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aiModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  aiModalContent: {
    padding: 16,
    flex: 1,
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
  buttonIcon: {
    marginRight: 4,
  },
  
  // Sonuç modalı için stiller
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  resultContent: {
    flex: 1,
    padding: 16,
  },
  taskList: {
    flex: 1,
    marginBottom: 0,
  },
  editHint: {
    fontSize: 13,
    color: '#2196F3',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Task öğesi stilleri
  aiTaskItem: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskDateContainer: {
    width: 80,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    justifyContent: 'center',
  },
  taskDate: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
    textAlign: 'center',
  },
  taskContent: {
    flex: 1,
    paddingLeft: 12,
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  pomodoroIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pomodoroText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  
  // Düzenleme stilleri
  editingTaskItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    padding: 12,
    marginVertical: 4,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editModalContent: {
    padding: 16,
  },
  editModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  editModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  editModalTextarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editModalPomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  editModalPomodoroButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  editModalPomodoroCount: {
    fontSize: 18,
    fontWeight: '500',
    marginHorizontal: 16,
    width: 30,
    textAlign: 'center',
  },
  editModalSaveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  editModalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // Alt butonlar
  bottomButtonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 20,
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  rejectButtonStyle: {
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  approveButtonStyle: {
    flex: 2,
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
  },
  
  // Boş görev durumu
  emptyTaskContainer: {
    alignItems: 'center',
    justifyContent: 'center', 
    padding: 40,
  },
  emptyTaskText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  editPomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 0,
    overflow: 'visible',
  },
});

export default AICalendarGenerator;
