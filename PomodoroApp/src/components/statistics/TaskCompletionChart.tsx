import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useStatistics } from '../../context/StatisticsContext';
import { TaskCompletionStats } from '../../types/statistics';

interface TaskCompletionChartProps {
  startDate: Date;
  endDate: Date;
  title?: string;
}

const TaskCompletionChart: React.FC<TaskCompletionChartProps> = ({ 
  startDate, 
  endDate,
  title = 'Görev Tamamlama Oranı' 
}) => {
  const { getTaskCompletionStats, isLoading, error } = useStatistics();
  const [stats, setStats] = useState<TaskCompletionStats[]>([]);
  const [aggregatedData, setAggregatedData] = useState<{
    completed: number;
    incomplete: number;
    completionRate: number;
  }>({ completed: 0, incomplete: 0, completionRate: 0 });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const taskStats = await getTaskCompletionStats(startDate, endDate);
        setStats(taskStats);
        
        // Toplu verileri hesapla
        const totalCompleted = taskStats.reduce((sum, day) => sum + day.completed, 0);
        const totalTasks = taskStats.reduce((sum, day) => sum + day.total, 0);
        const incomplete = totalTasks - totalCompleted;
        const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
        
        setAggregatedData({
          completed: totalCompleted,
          incomplete,
          completionRate
        });
        
      } catch (err) {
        console.error('Görev tamamlama istatistikleri yüklenirken hata:', err);
      }
    };
    
    fetchStats();
  }, [startDate, endDate]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  if (!stats.length) {
    return null;
  }

  const screenWidth = Dimensions.get("window").width - 40;
  
  // Pasta grafik verileri
  const pieData = [
    {
      name: "Tamamlanmış",
      population: aggregatedData.completed,
      color: '#5E60CE',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: "Tamamlanmamış",
      population: aggregatedData.incomplete,
      color: '#E5E5E5',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }
  ].filter(segment => segment.population > 0); // Sıfır değerli dilimleri filtrele
  
  // Eğer tüm görevler tamamlanmış veya hiç tamamlanmamışsa tek dilim göster
  if (pieData.length === 0) {
    pieData.push({
      name: "Veri Yok",
      population: 1,
      color: '#E5E5E5',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    });
  }

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>
      
      <View style={styles.dateRangeContainer}>
        <Text style={styles.dateRangeText}>
          {format(startDate, 'd MMM', { locale: tr })} - {format(endDate, 'd MMM yyyy', { locale: tr })}
        </Text>
      </View>
      
      <View style={styles.pieContainer}>
        <PieChart
          data={pieData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          hasLegend={false}
        />
        
        {/* Orta kısımdaki yüzde gösterimi */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerPercent}>{aggregatedData.completionRate}%</Text>
          <Text style={styles.centerText}>Tamamlama</Text>
          <Text style={styles.centerText}>Oranı</Text>
        </View>
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#5E60CE' }]} />
          <Text style={styles.legendText}>Tamamlanan ({aggregatedData.completed})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E5E5E5' }]} />
          <Text style={styles.legendText}>Bekleyen ({aggregatedData.incomplete})</Text>
        </View>
      </View>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          Bu dönemde <Text style={styles.highlight}>{aggregatedData.completed}</Text> görev tamamladın,
          bu da toplam görevlerin <Text style={styles.highlight}>{aggregatedData.completionRate}%</Text>'si.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateRangeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 220,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPercent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5E60CE',
  },
  centerText: {
    fontSize: 14,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  summaryContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  summaryText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#5E60CE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
});

export default TaskCompletionChart;
