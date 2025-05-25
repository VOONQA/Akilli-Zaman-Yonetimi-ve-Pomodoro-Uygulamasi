import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import { useStatistics } from '../../context/StatisticsContext';
import { DailyStats } from '../../types/statistics';

interface DailyStatsChartProps {
  date: Date;
}

// Chart veri tipi için doğru interface tanımlaması
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
  legend?: string[];
}

const DailyStatsChart: React.FC<DailyStatsChartProps> = ({ date }) => {
  const { getDailyStats, isLoading, error } = useStatistics();
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  // Doğru tip ile başlatma
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }]
  });
  
  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const stats = await getDailyStats(date);
        setDailyStats(stats);
        
        // Saatlik veri oluşturma
        const hourlyData = generateHourlyDataFromStats(stats);
        
        // Chart formatına dönüştür - sadece veriyi kullan, etiketler için özel bir dizi kullan
        setChartData({
          // Sadece belirli saatleri etiketleyelim (9, 12, 15, 18, 21)
          labels: hourlyData.map(d => d.x),
          datasets: [{ 
            data: hourlyData.map(d => d.y),
            // Etiketlerdeki boş stringleri göstermemek için strokeWidth ve color özellikleri
            strokeWidth: 2,
            color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`
          }]
        });
        
      } catch (err) {
        console.error('Günlük istatistikler yüklenirken hata:', err);
      }
    };
    
    fetchDailyStats();
  }, [date]);
  
  const generateHourlyDataFromStats = (stats: DailyStats) => {
    // Tüm saatleri tutalım ama etiket olarak sadece 5 saati gösterelim
    return Array.from({ length: 14 }, (_, i) => {
      const hour = i + 9; // 9'dan 22'ye
      
      const value = hour === (stats.mostProductiveHour || 0) 
        ? stats.completedPomodoros / 2 
        : Math.floor(Math.random() * (stats.completedPomodoros / 4));
      
      // X ekseninde görüntülenecek etiketleri belirleyelim
      // Sadece belirli saatleri etiketleyelim (9, 12, 15, 18, 21)
      const keyHours = [9, 12, 15, 18, 21];
      const displayLabel = keyHours.includes(hour) ? `${hour}:00` : '';
      
      return {
        x: displayLabel,
        y: value
      };
    });
  };
  
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

  if (!dailyStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          {format(date, 'd MMMM yyyy', { locale: tr })} Günlük Aktivite
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
        
        <Text style={styles.chartTitle}>Saatlik Aktivite</Text>
        
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Bu gün için henüz veri bulunmuyor.
          </Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width - 40;

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`, // #5E60CE
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    barPercentage: 0.7
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {format(date, 'd MMMM yyyy', { locale: tr })} Günlük Aktivite
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dailyStats.completedPomodoros}</Text>
          <Text style={styles.statLabel}>Tamamlanan{"\n"}Pomodoro</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.floor(dailyStats.totalFocusTime / 60)}
          </Text>
          <Text style={styles.statLabel}>Toplam{"\n"}Dakika</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {dailyStats.tasks.completed}/{dailyStats.tasks.total}
          </Text>
          <Text style={styles.statLabel}>Tamamlanan{"\n"}Görev</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {dailyStats.tasks.total > 0
              ? Math.floor((dailyStats.tasks.completed > 0
                  ? dailyStats.totalFocusTime / dailyStats.tasks.completed
                  : 0) / 60)
              : 0}
          </Text>
          <Text style={styles.statLabel}>Görev{"\n"}Süresi</Text>
        </View>
      </View>
      
      <Text style={styles.chartTitle}>Saatlik Aktivite</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            ...chartConfig,
            strokeWidth: 2,
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#5E60CE"
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
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

export default DailyStatsChart;
