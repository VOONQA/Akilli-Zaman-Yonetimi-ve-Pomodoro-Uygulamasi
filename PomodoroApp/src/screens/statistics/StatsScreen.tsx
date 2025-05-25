import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, PanResponder } from 'react-native';
import { TabScreenProps } from '../../navigation/navigationTypes';
import { 
  DailyStatsChart, 
  WeeklyStatsChart, 
  MonthlyStatsChart,
  TaskCompletionChart,
  ProductivityAnalysis
} from '../../components/statistics';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTabBarSpace } from '../../hooks/useTabBarSpace';

type TimeFrameType = 'daily' | 'weekly' | 'monthly';

type Props = TabScreenProps<'Statistics'>;

const StatsScreen: React.FC<Props> = ({ navigation }) => {
  const { containerStyle, TabBarSpacer } = useTabBarSpace();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrameType>('daily');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  
  const handlePrevious = () => {
    switch (selectedTimeFrame) {
      case 'daily':
        setCurrentDate(prev => subDays(prev, 1));
        break;
      case 'weekly':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'monthly':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
    }
  };
  
  const handleNext = () => {
    switch (selectedTimeFrame) {
      case 'daily':
        const tomorrow = addDays(currentDate, 1);
        if (!isSameDay(tomorrow, new Date()) && tomorrow < new Date()) {
          setCurrentDate(tomorrow);
        }
        break;
      case 'weekly':
        const nextWeek = addWeeks(currentDate, 1);
        if (nextWeek < new Date()) {
          setCurrentDate(nextWeek);
        }
        break;
      case 'monthly':
        const nextMonth = addMonths(currentDate, 1);
        if (nextMonth < new Date()) {
          setCurrentDate(nextMonth);
        }
        break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Zaman dilimi için düğme render fonksiyonu
  const renderTimeFrameButton = (timeFrame: TimeFrameType, label: string) => (
    <TouchableOpacity
      style={[
        styles.timeFrameButton,
        selectedTimeFrame === timeFrame && styles.selectedTimeFrameButton
      ]}
      onPress={() => setSelectedTimeFrame(timeFrame)}
    >
      <Text 
        style={[
          styles.timeFrameButtonText,
          selectedTimeFrame === timeFrame && styles.selectedTimeFrameButtonText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  // Zaman dilimi kontrollerini render et
  const renderTimeControls = () => (
    <View style={styles.timeControlsContainer}>
      <View style={styles.timeFrameSelector}>
        {renderTimeFrameButton('daily', 'Günlük')}
        {renderTimeFrameButton('weekly', 'Haftalık')}
        {renderTimeFrameButton('monthly', 'Aylık')}
      </View>
      
      <View style={styles.navigationControls}>
        <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
          <Text style={styles.todayButtonText}>Bugün</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleNext}
          disabled={selectedTimeFrame === 'daily' && isSameDay(currentDate, new Date())}
        >
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Seçilen zaman dilimine göre istatistik bileşenini göster
  const renderStatsByTimeFrame = () => {
    switch (selectedTimeFrame) {
      case 'daily':
        return <DailyStatsChart date={currentDate} />;
      case 'weekly':
        return <WeeklyStatsChart date={currentDate} />;
      case 'monthly':
        return <MonthlyStatsChart date={currentDate} />;
    }
  };
  
  // Swipe gesture
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 30;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        // Sağa kaydır - Tasks'a git
        navigation.navigate('Tasks');
      } else if (gestureState.dx < -50) {
        // Sola kaydır - Settings'e git
        navigation.navigate('Settings');
      }
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentInsetAdjustmentBehavior="automatic"
        scrollEventThrottle={16}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>İstatistikler</Text>
          <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={22} color="#5E60CE" />
          </TouchableOpacity>
        </View>
        
        {renderTimeControls()}
        
        {renderStatsByTimeFrame()}
        
        <TaskCompletionChart 
          startDate={subDays(new Date(), 30)}
          endDate={new Date()}
          title="Son 30 Gün Görev Tamamlama"
        />
        
        <ProductivityAnalysis
          startDate={subDays(new Date(), 30)}
          endDate={new Date()}
          timeRange={selectedTimeFrame}
          date={currentDate}
        />
        
        <TabBarSpacer />
      </ScrollView>

      {/* Bilgi Modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setInfoModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İstatistikler Hakkında</Text>
            <Text style={styles.modalText}>
              Burada gösterilen istatistikler, yalnızca Pomodoro oturumlarında görev bazlı çalışmalarınızı kapsar. 
              Daha fazla veri görmek için görevler oluşturun ve Pomodoro oturumlarında çalışın.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, 
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  timeControlsContainer: {
    marginBottom: 16,
  },
  timeFrameSelector: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
    padding: 4,
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  selectedTimeFrameButton: {
    backgroundColor: '#5E60CE',
  },
  timeFrameButtonText: {
    color: '#444',
    fontWeight: '500',
  },
  selectedTimeFrameButtonText: {
    color: '#FFFFFF',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  navButtonText: {
    fontSize: 18,
    color: '#5E60CE',
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#5E60CE',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorContainer: {
    display: 'none', // Hata mesajını gizle
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#5E60CE',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
    color: '#444',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#5E60CE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default StatsScreen;