import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useStatistics } from '../../context/StatisticsContext';
import { WeeklyStats } from '../../types/statistics';

interface WeeklyStatsChartProps {
  date: Date;
}

// Chart veri tipi
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

const WeeklyStatsChart: React.FC<WeeklyStatsChartProps> = ({ date }) => {
  const { getWeeklyStats, isLoading, error } = useStatistics();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }]
  });
  
  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        const stats = await getWeeklyStats(date);
        setWeeklyStats(stats);
        
        // Gün kısaltmalarını oluştur
        const dayLabels = stats.days.map(day => 
          format(new Date(day.date), 'E', { locale: tr })
        );
        
        // Veri kümelerini oluştur
        const pomodoroData = stats.days.map(day => day.completedPomodoros);
        const taskData = stats.days.map(day => day.tasks.completed);
        
        setChartData({
          labels: dayLabels,
          datasets: [
            {
              data: pomodoroData,
              color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`, // #5E60CE
            },
            {
              data: taskData,
              color: (opacity = 1) => `rgba(100, 223, 223, ${opacity})`, // #64DFDF
            }
          ]
        });
        
      } catch (err) {
        console.error('Haftalık istatistikler yüklenirken hata:', err);
      }
    };
    
    fetchWeeklyStats();
  }, [date]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (!weeklyStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Haftalık Performans
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Tamamlanan{"\n"}Pomodoro</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Toplam{"\n"}Dakika</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0/0</Text>
            <Text style={styles.statLabel}>Tamamlanan{"\n"}Görev</Text>
          </View>
        </View>
        
        <Text style={styles.chartTitle}>Haftalık Dağılım</Text>
        
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Bu hafta için henüz veri bulunmuyor.
          </Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width - 40;
  const startDateObj = new Date(weeklyStats.startDate);
  const endDateObj = new Date(weeklyStats.endDate);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    barPercentage: 0.7,
    propsForDots: {
      r: "5",
      strokeWidth: "2",
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Haftalık Performans: {format(startDateObj, 'd MMM', { locale: tr })} - {format(endDateObj, 'd MMM', { locale: tr })}
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{weeklyStats.completedPomodoros}</Text>
          <Text style={styles.statLabel}>Tamamlanan{"\n"}Pomodoro</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.floor(weeklyStats.totalFocusTime / 60)}
          </Text>
          <Text style={styles.statLabel}>Toplam{"\n"}Dakika</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {weeklyStats.tasks.completed}/{weeklyStats.tasks.total}
          </Text>
          <Text style={styles.statLabel}>Tamamlanan{"\n"}Görev</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {weeklyStats.tasks.total > 0
              ? Math.floor((weeklyStats.tasks.completed > 0
                  ? weeklyStats.totalFocusTime / weeklyStats.tasks.completed
                  : 0) / 60)
              : 0}
          </Text>
          <Text style={styles.statLabel}>Görev{"\n"}Süresi</Text>
        </View>
      </View>
      
      <Text style={styles.chartTitle}>Haftalık Dağılım</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          withDots
          withShadow={false}
          withInnerLines={false}
          withOuterLines
        />
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#5E60CE' }]} />
          <Text style={styles.legendText}>Pomodorolar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#64DFDF' }]} />
          <Text style={styles.legendText}>Görevler</Text>
        </View>
      </View>
      
      {weeklyStats.mostProductiveDay && (
        <Text style={styles.productiveText}>
          En verimli gününüz: <Text style={styles.highlight}>
            {format(new Date(weeklyStats.mostProductiveDay), 'EEEE', { locale: tr })}
          </Text>
        </Text>
      )}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5E60CE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
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
  productiveText: {
    textAlign: 'center',
    marginTop: 10,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#5E60CE',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 20,
  },
  noDataText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default WeeklyStatsChart;
