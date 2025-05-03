import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useStatistics } from '../../context/StatisticsContext';
import { HourlyProductivity, AIProductivityInsight } from '../../types/statistics';
import { getProductivityAnalysis } from '../../services/statistics/aiProductivityAnalysis';
import { getAIAnalysis } from '../../services/statistics/aiAnalysisService';
import { Ionicons } from '@expo/vector-icons';

interface ProductivityAnalysisProps {
  startDate: Date;
  endDate: Date;
  timeRange: 'daily' | 'weekly' | 'monthly';
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
  legend?: string[];
}

const ProductivityAnalysis: React.FC<ProductivityAnalysisProps> = ({ 
  startDate, 
  endDate,
  timeRange,
  date
}) => {
  const { getProductivityByHour, getMostProductiveTimePeriod, getDailyStats, isLoading, error } = useStatistics();
  const [hourlyData, setHourlyData] = useState<HourlyProductivity[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [insights, setInsights] = useState<AIProductivityInsight[]>([]);
  const [mostProductive, setMostProductive] = useState<{
    hour: number;
    day: string;
    productivity: number;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [insightsRequested, setInsightsRequested] = useState(false);

  const showInfoMessage = () => {
    Alert.alert(
      "Verimlilik Analizi Hakkında",
      "Bu bölümde gösterilen verimlilik verileri, tamamladığınız pomodoro oturumlarına dayanır. Daha doğru sonuçlar için düzenli olarak pomodoro tekniğiyle çalışın. Veriler sadece görev bazlı çalışmalarınızı kapsar.",
      [{ text: "Anladım", style: "default" }]
    );
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const hourlyStats = await getProductivityByHour(startDate, endDate);
        setHourlyData(hourlyStats);
        
        // Grafik verisini oluştur
        const filteredStats = hourlyStats.filter(stats => stats.productivity > 0);
        
        // Eğer veri yoksa örnek veri oluştur
        if (filteredStats.length === 0) {
          setChartData({
            labels: ['Veri yok'],
            datasets: [{ data: [0] }]
          });
        } else {
          setChartData({
            labels: filteredStats.map(h => `${h.hour}:00`),
            datasets: [{ data: filteredStats.map(h => h.productivity) }]
          });
        }
        
        const productiveTime = await getMostProductiveTimePeriod();
        setMostProductive(productiveTime);
        
        // Son 7 günün istatistiklerini al ve sakla (AI analizi için)
        const dailyStatsPromises = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dailyStatsPromises.push(getDailyStats(date));
        }
        const stats = await Promise.all(dailyStatsPromises);
        setDailyStats(stats);
        
        // Görüntülenen döneme özel verileri getir
        const periodValue = getPeriodValue(timeRange, date);
        
        // Veritabanında bu zaman aralığı için kayıtlı AI önerisi var mı kontrol et
        const savedAnalysis = await getAIAnalysis(timeRange, periodValue);
        
        if (savedAnalysis && savedAnalysis.length > 0) {
          // Varsa direkt göster
          setInsights(savedAnalysis);
          setInsightsRequested(true);
        } else {
          // Eğer bu dönem için kayıtlı analiz yoksa, insights'ı temizle ve requested durumunu sıfırla
          setInsights([]);
          setInsightsRequested(false);
        }
        
      } catch (err) {
        console.error('Verimlilik analizi verileri yüklenirken hata:', err);
      }
    };
    
    fetchData();
  }, [date, timeRange]); // timeRange ve date değiştiğinde tekrar çalıştır
  
  // Dönem değerini formatla (AI servis ile aynı mantık)
  const getPeriodValue = (timeRange: 'daily' | 'weekly' | 'monthly', date: Date): string => {
    if (timeRange === 'daily') {
      return format(date, 'yyyy-MM-dd');
    } else if (timeRange === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
      return format(weekStart, 'yyyy-MM-dd');
    } else {
      return format(date, 'yyyy-MM');
    }
  };
  
  // AI analizini yapacak fonksiyon - güncellendi
  const fetchAIInsights = async () => {
    if (aiLoading) return;
    
    setAiLoading(true);
    setInsightsRequested(true);
    
    try {
      // Son 7 günün istatistiklerini al (AI analizi için)
      const dailyStatsPromises = [];
      for (let i = 0; i < 7; i++) {
        const statDate = new Date();
        statDate.setDate(statDate.getDate() - i);
        dailyStatsPromises.push(getDailyStats(statDate));
      }
      const dailyStats = await Promise.all(dailyStatsPromises);
      
      // Şu anda görüntülenen dönem için yapay zeka analizi iste
      const aiInsights = await getProductivityAnalysis(
        dailyStats, 
        hourlyData,
        timeRange,
        date
      );
      
      if (aiInsights) {
        setInsights(aiInsights);
      }
    } catch (aiErr) {
      console.error('AI analizi yapılırken hata:', aiErr);
      // Hata mesajını gösterme, sadece log
    } finally {
      setAiLoading(false);
    }
  };
  
  // Gösterilen tarih aralığını formatla
  const formatDateRange = () => {
    if (timeRange === 'daily') {
      return format(date, 'd MMMM yyyy', { locale: tr });
    } else if (timeRange === 'weekly') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`;
    } else {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return `${format(monthStart, 'MMMM yyyy', { locale: tr })}`;
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width - 40;

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(94, 96, 206, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    barPercentage: 0.7
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          Verimlilik Analizi
        </Text>
        <TouchableOpacity onPress={showInfoMessage} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={20} color="#5E60CE" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.dateRangeContainer}>
        <Text style={styles.dateRangeText}>
          {formatDateRange()}
        </Text>
      </View>
      
      {hourlyData.length > 0 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Saatlik Verimlilik</Text>
          <LineChart
            data={chartData}
            width={screenWidth}
            height={180}
            yAxisLabel=""
            yAxisSuffix="%"
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
              marginVertical: 0,
              borderRadius: 16
            }}
          />
        </View>
      ) : (
        <View style={{height: 20}} />
      )}
      
      <View style={styles.insightsContainer}>
        <View style={styles.insightsHeader}>
          <Text style={styles.insightsTitle}>
            Yapay Zeka Önerileri
            {aiLoading && <ActivityIndicator size="small" color="#5E60CE" style={styles.aiLoadingIndicator} />}
          </Text>
          
          {!insightsRequested && (
            <TouchableOpacity 
              style={styles.analyzeButton} 
              onPress={fetchAIInsights}
              disabled={aiLoading}
            >
              <Text style={styles.analyzeButtonText}>Analiz Et</Text>
            </TouchableOpacity>
          )}
          
          {insightsRequested && !aiLoading && (
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={fetchAIInsights}
              disabled={aiLoading}
            >
              <Text style={styles.refreshButtonText}>Yenile</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {!insightsRequested ? (
          <View style={styles.noInsightsContainer}>
            <Text style={styles.noInsightsText}>
              Yapay zeka önerilerini görmek için "Analiz Et" butonuna tıklayın.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.insightsList}>
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightTitle}>{insight.insight}</Text>
                    <View style={[
                      styles.insightScore, 
                      { backgroundColor: getScoreColor(insight.score) }
                    ]}>
                      <Text style={styles.insightScoreText}>{insight.score}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.insightCategory}>
                    {getCategoryLabel(insight.category)}
                  </Text>
                  
                  <Text style={styles.insightRecommendation}>
                    {insight.recommendation}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noInsightsContainer}>
                <Text style={styles.noInsightsText}>
                  Henüz yeterli veri bulunmuyor. Daha fazla Pomodoro oturumu tamamlayarak kişiselleştirilmiş öneriler alabilirsiniz.
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

// Puan için renk döndüren yardımcı fonksiyon
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  return '#F44336';
};

// Kategori için etiket döndüren yardımcı fonksiyon
const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'time': return '⏰ Zaman';
    case 'task': return '📝 Görev';
    case 'focus': return '🎯 Odaklanma';
    case 'break': return '☕ Mola';
    case 'habit': return '🔄 Alışkanlık';
    default: return category;
  }
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoButton: {
    marginLeft: 6,
    padding: 2,
  },
  dateRangeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    marginBottom: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightsContainer: {
    marginTop: 0,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiLoadingIndicator: {
    marginLeft: 10,
  },
  analyzeButton: {
    backgroundColor: '#5E60CE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshButton: {
    backgroundColor: '#64DFDF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  insightsList: {
    // maxHeight: 300, // Bu satırı kaldırıyoruz ki yapay zeka mesajları tam görünsün
  },
  insightItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  insightScore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  insightScoreText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  insightCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  insightRecommendation: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorContainer: {
    display: 'none', // Hata mesajını gizle
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  noInsightsContainer: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  noInsightsText: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProductivityAnalysis;
