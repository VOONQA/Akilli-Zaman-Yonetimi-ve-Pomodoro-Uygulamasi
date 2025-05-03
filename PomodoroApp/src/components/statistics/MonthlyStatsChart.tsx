import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useStatistics } from '../../context/StatisticsContext';
import { MonthlyStats } from '../../types/statistics';

interface MonthlyStatsChartProps {
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

const MonthlyStatsChart: React.FC<MonthlyStatsChartProps> = ({ date }) => {
  const { getMonthlyStats, isLoading, error } = useStatistics();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [hasData, setHasData] = useState(false);
  
  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        const stats = await getMonthlyStats(date);
        setMonthlyStats(stats);
        
        // Ay içindeki haftalar için grafik verisini oluştur
        const monthStart = startOfMonth(new Date(stats.year, stats.month));
        const monthEnd = endOfMonth(new Date(stats.year, stats.month));
        
        const weeks = eachWeekOfInterval({
          start: monthStart,
          end: monthEnd
        });
        
        // Grafik etiketleri
        const labels = weeks.map((weekStart, index) => {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return `${format(weekStart, 'd')}-${format(weekEnd, 'd')}`;
        });
        
        // Veri var mı kontrol et
        const hasAnyData = stats.totalPomodoros > 0 || stats.tasks.total > 0;
        setHasData(hasAnyData);
        
        // Gerçek verileri kullan
        if (stats.weeks && stats.weeks.length > 0) {
          const pomodoroData = stats.weeks.map(week => week.completedPomodoros);
          const taskData = stats.weeks.map(week => week.tasks.completed);
          
          setChartData({
            labels,
            datasets: [
              {
                data: pomodoroData,
                color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`, // #5E60CE
                strokeWidth: 2
              },
              {
                data: taskData,
                color: (opacity = 1) => `rgba(100, 223, 223, ${opacity})`, // #64DFDF
                strokeWidth: 2
              }
            ]
          });
        } else {
          // Veri yoksa boş grafik göster
          setChartData({
            labels,
            datasets: [
              {
                data: new Array(labels.length).fill(0),
                color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`,
                strokeWidth: 2
              },
              {
                data: new Array(labels.length).fill(0),
                color: (opacity = 1) => `rgba(100, 223, 223, ${opacity})`,
                strokeWidth: 2
              }
            ]
          });
        }
        
      } catch (err) {
        console.error('Aylık istatistikler yüklenirken hata:', err);
      }
    };
    
    fetchMonthlyStats();
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
  
  if (!monthlyStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Aylık Performans
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
            Bu ay için henüz veri bulunmuyor.
          </Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width - 40;
  const monthName = format(new Date(monthlyStats.year, monthlyStats.month), 'MMMM yyyy', { locale: tr });

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
        {monthName} Ayı Performansı
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{monthlyStats.completedPomodoros}</Text>
          <Text style={styles.statLabel}>Tamamlanan{"\n"}Pomodoro</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.floor(monthlyStats.totalFocusTime / 60)}
          </Text>
          <Text style={styles.statLabel}>Toplam{"\n"}Dakika</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {monthlyStats.tasks.completed}/{monthlyStats.tasks.total}
          </Text>
          <Text style={styles.statLabel}>Tamamlanan{"\n"}Görev</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {monthlyStats.tasks.total > 0
              ? Math.floor((monthlyStats.tasks.completed > 0
                  ? monthlyStats.totalFocusTime / monthlyStats.tasks.completed
                  : 0) / 60)
              : 0}
          </Text>
          <Text style={styles.statLabel}>Görev{"\n"}Süresi</Text>
        </View>
      </View>
      
      <Text style={styles.chartTitle}>Haftalık Dağılım</Text>
      
      {hasData ? (
        <>
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
          
          {monthlyStats.mostProductiveWeek && (
            <Text style={styles.productiveText}>
              En verimli hafta: <Text style={styles.highlight}>
                {format(new Date(monthlyStats.mostProductiveWeek.startDate), 'd')} - 
                {format(new Date(monthlyStats.mostProductiveWeek.endDate), 'd MMM')}
              </Text>
            </Text>
          )}
        </>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Bu ay için henüz veri bulunmuyor.
          </Text>
        </View>
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
  legendLine: {
    width: 12,
    height: 3,
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
});

export default MonthlyStatsChart;
