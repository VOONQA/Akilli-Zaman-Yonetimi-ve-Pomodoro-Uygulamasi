import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatisticsCardProps {
  totalFocusTime: number;
  totalTasksCompleted: number;
  taskCompletionRate: number;
  mostProductiveDay: string;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  totalFocusTime,
  totalTasksCompleted,
  taskCompletionRate,
  mostProductiveDay
}) => {
  // Odak süresini saat ve dakika formatına dönüştür
  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} saat ${mins} dk`;
    } else {
      return `${mins} dk`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={20} color="#4a6da7" />
          </View>
          <View>
            <Text style={styles.statValue}>{formatFocusTime(totalFocusTime)}</Text>
            <Text style={styles.statLabel}>Toplam Odak Süresi</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-done-outline" size={20} color="#4a6da7" />
          </View>
          <View>
            <Text style={styles.statValue}>{totalTasksCompleted}</Text>
            <Text style={styles.statLabel}>Tamamlanan Görevler</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="trending-up-outline" size={20} color="#4a6da7" />
          </View>
          <View>
            <Text style={styles.statValue}>{Math.round(taskCompletionRate * 100)}%</Text>
            <Text style={styles.statLabel}>Görev Tamamlama{'\n'}Oranı</Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={20} color="#4a6da7" />
          </View>
          <View>
            <Text style={styles.statValue}>{mostProductiveDay}</Text>
            <Text style={styles.statLabel}>En Verimli Gün</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 6,
  },
});

export default StatisticsCard;
