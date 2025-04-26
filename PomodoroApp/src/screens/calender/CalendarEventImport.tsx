import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootScreenProps } from '../../navigation/navigationTypes';
import { useTask } from '../../context/TaskContext';
import { CreateTaskDTO } from '../../models/Task';

type Props = RootScreenProps<'CalendarEventImport'>;

const CalendarEventImport: React.FC<Props> = ({ route, navigation }) => {
  const { calendarEvents } = route.params || { calendarEvents: [] };
  const { addTask } = useTask();
  
  const [selectedEvents, setSelectedEvents] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);
  
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  const handleImportSelected = async () => {
    const selectedEventIds = Object.keys(selectedEvents).filter(id => selectedEvents[id]);
    
    if (selectedEventIds.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir etkinlik seçin.');
      return;
    }
    
    setLoading(true);
    try {
      const selectedEventsData = calendarEvents.filter(event => 
        selectedEventIds.includes(event.calendarEventId));
      
      for (const event of selectedEventsData) {
        const taskData: CreateTaskDTO = {
          title: event.title,
          description: event.description || undefined,
          date: new Date(event.date),
          dueDate: event.dueDate ? new Date(event.dueDate) : undefined,
          pomodoroCount: event.pomodoroCount || 2
        };
        
        await addTask(taskData);
      }
      
      Alert.alert(
        'Başarılı', 
        `${selectedEventIds.length} etkinlik görev olarak eklendi.`,
        [
          { text: 'Görevlere Git', onPress: () => navigation.navigate('MainTabs', { screen: 'Tasks' }) },
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Etkinlikler içe aktarılırken hata:', error);
      Alert.alert('Hata', 'Etkinlikler görev olarak eklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderEventItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.eventItem,
        selectedEvents[item.calendarEventId] && styles.selectedEventItem
      ]}
      onPress={() => toggleEventSelection(item.calendarEventId)}
    >
      <View style={styles.eventInfoContainer}>
        <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
        
        {item.description ? (
          <Text style={styles.eventDescription} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
        
        <Text style={styles.eventDate}>
          {new Date(item.date).toLocaleString('tr-TR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      
      <View style={styles.checkboxContainer}>
        {selectedEvents[item.calendarEventId] ? (
          <Ionicons name="checkmark-circle" size={24} color="#FF5722" />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Etkinlikleri İçe Aktar</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {calendarEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>İçe aktarılacak etkinlik bulunamadı.</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Görevlere dönüştürmek istediğiniz etkinlikleri seçin.
            </Text>
          </View>
          
          <FlatList
            data={calendarEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.calendarEventId}
            contentContainerStyle={styles.eventList}
          />
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={() => {
                const allSelected = calendarEvents.length === Object.keys(selectedEvents).length &&
                  Object.values(selectedEvents).every(v => v);
                
                if (allSelected) {
                  setSelectedEvents({});
                } else {
                  const newSelectedEvents: Record<string, boolean> = {};
                  calendarEvents.forEach(event => {
                    if (event && event.calendarEventId) {
                      newSelectedEvents[event.calendarEventId] = true;
                    }
                  });
                  setSelectedEvents(newSelectedEvents);
                }
              }}
            >
              <Text style={styles.selectAllButtonText}>
                {calendarEvents.length === Object.keys(selectedEvents).length &&
                  Object.values(selectedEvents).every(v => v) 
                  ? 'Tümünü Kaldır' 
                  : 'Tümünü Seç'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImportSelected}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.importButtonText}>
                  Seçilenleri İçe Aktar ({Object.values(selectedEvents).filter(v => v).length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  infoText: {
    color: '#795548',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  eventList: {
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedEventItem: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  eventInfoContainer: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 13,
    color: '#FF5722',
  },
  checkboxContainer: {
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectAllButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  selectAllButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  importButton: {
    flex: 2,
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default CalendarEventImport;
