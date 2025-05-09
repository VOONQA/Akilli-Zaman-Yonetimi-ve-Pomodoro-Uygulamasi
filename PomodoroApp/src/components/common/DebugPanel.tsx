import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTask } from '../../context/TaskContext';
import { openDatabase, getDatabasePath } from '../../services/database';
import { formatISO, subDays, format } from 'date-fns';
import uuid from 'react-native-uuid';
import { useStatistics } from '../../context/StatisticsContext';
import { tr } from 'date-fns/locale';

// Tablo tipi tanımı
interface TableInfo {
  name: string;
}

// Görev sayı tipi tanımı
interface CountResult {
  count: number;
}

export default function DebugPanel() {
  const { tasks } = useTask();
  const { isLoading, getDailyStats, getWeeklyStats, getMonthlyStats } = useStatistics();
  const [dbInfo, setDbInfo] = useState<any>({});
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [aiAnalysisCount, setAiAnalysisCount] = useState(0);
  const [statsData, setStatsData] = useState<any>({
    dailyStats: null,
    weeklyStats: null,
    monthlyStats: null
  });
  
  const checkDatabase = async () => {
    try {
      const db = openDatabase();
      const dbPath = getDatabasePath();
      console.log('Veritabanı Yolu:', dbPath);
      
      // Tabloları kontrol et
      const tablesResult = await db.select<TableInfo>(`SELECT name FROM sqlite_master WHERE type='table'`);
      setTables(tablesResult);
      
      // Tablodaki görev sayısını kontrol et
      if (tablesResult.some((t: TableInfo) => t.name === 'tasks')) {
        const countResult = await db.select<CountResult>(`SELECT COUNT(*) as count FROM tasks`);
        const taskRows = await db.select(`SELECT * FROM tasks LIMIT 10`);
        
        setDbInfo({
          dbPath: dbPath,
          taskCount: countResult[0]?.count || 0,
          sampleTasks: taskRows
        });
      }
      
      // Pomodoro oturumları sayısını kontrol et
      if (tablesResult.some((t: TableInfo) => t.name === 'pomodoro_sessions')) {
        const countResult = await db.select<CountResult>(`SELECT COUNT(*) as count FROM pomodoro_sessions`);
        setPomodoroCount(countResult[0]?.count || 0);
        
        const pomodoroRows = await db.select(`SELECT * FROM pomodoro_sessions LIMIT 10`);
        setDbInfo((prev: any) => ({
          ...prev,
          samplePomodoros: pomodoroRows
        }));
      }
      
      // AI analiz tablosundaki verileri kontrol et
      if (tablesResult.some((t: TableInfo) => t.name === 'ai_analysis')) {
        const countResult = await db.select<CountResult>(`SELECT COUNT(*) as count FROM ai_analysis`);
        setAiAnalysisCount(countResult[0]?.count || 0);
        
        const aiRows = await db.select(`SELECT * FROM ai_analysis LIMIT 5`);
        setDbInfo((prev: any) => ({
          ...prev,
          sampleAiAnalysis: aiRows
        }));
      }
      
      // Not klasörleri tablosunu kontrol et
      if (tablesResult.some((t: TableInfo) => t.name === 'note_folders')) {
        const countResult = await db.select<CountResult>(`SELECT COUNT(*) as count FROM note_folders`);
        const folderCount = countResult[0]?.count || 0;
        
        const folderRows = await db.select(`SELECT * FROM note_folders LIMIT 10`);
        setDbInfo((prev: any) => ({
          ...prev,
          folderCount: folderCount,
          sampleFolders: folderRows
        }));
      }
      
      // İstatistik verilerini çek
      try {
        const today = new Date();
        const dailyStats = await getDailyStats(today);
        const weeklyStats = await getWeeklyStats(today);
        const monthlyStats = await getMonthlyStats(today);
        
        setStatsData({
          dailyStats,
          weeklyStats,
          monthlyStats
        });
      } catch (statsError) {
        console.error('İstatistik verileri alınırken hata:', statsError);
      }
      
    } catch (error) {
      console.error('Veritabanı kontrol hatası:', error);
      setDbInfo({ error: JSON.stringify(error) });
    }
  };
  
  // Test verisi oluşturma fonksiyonu
  const generateTestData = async () => {
    try {
      const db = openDatabase();
      
      // Pomodoro_sessions tablosunu kontrol et, yoksa oluştur
      const tableExists = await db.select<TableInfo>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pomodoro_sessions'"
      );
      
      if (tableExists.length === 0) {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS pomodoro_sessions (
            id TEXT PRIMARY KEY,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration INTEGER NOT NULL,
            task_id TEXT,
            type TEXT NOT NULL,
            completed INTEGER NOT NULL,
            date TEXT NOT NULL,
            time_of_day INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);
      }
      
      // Son 30 gün için rastgele veriler ekle
      const today = new Date();
      const taskIds = tasks.map(task => task.id);
      
      // Her gün için 1-5 arası pomodoro
      for (let i = 0; i < 30; i++) {
        const date = subDays(today, i);
        const dateStr = formatISO(date).split('T')[0];
        const pomodoroCount = Math.floor(Math.random() * 5) + 1;
        
        for (let j = 0; j < pomodoroCount; j++) {
          const startTime = new Date(date);
          startTime.setHours(Math.floor(Math.random() * 16) + 8); // 8 - 23 arası saat
          
          const duration = 25 * 60; // 25 dakika (saniye cinsinden)
          
          const endTime = new Date(startTime);
          endTime.setSeconds(endTime.getSeconds() + duration);
          
          const taskId = taskIds.length > 0 
            ? taskIds[Math.floor(Math.random() * taskIds.length)] 
            : null;
          
          const sessionId = uuid.v4().toString();
          
          await db.insert('pomodoro_sessions', {
            id: sessionId,
            start_time: formatISO(startTime),
            end_time: formatISO(endTime),
            duration: duration,
            task_id: taskId,
            type: 'pomodoro',
            completed: Math.random() > 0.2 ? 1 : 0, // %80 tamamlanma olasılığı
            date: dateStr,
            time_of_day: startTime.getHours(),
            created_at: formatISO(new Date()),
            updated_at: formatISO(new Date())
          });
        }
      }
      
      Alert.alert('Başarılı', 'Test verileri oluşturuldu! Son 30 gün için rastgele pomodoro oturumları eklendi.');
      checkDatabase();
    } catch (error) {
      console.error('Test verisi oluşturma hatası:', error);
      Alert.alert('Hata', 'Test verileri oluşturulurken bir hata oluştu: ' + JSON.stringify(error));
    }
  };
  
  useEffect(() => {
    checkDatabase();
  }, []);
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Paneli</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veritabanı Bilgisi</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Tablolar:</Text>
          {tables.map((table, index) => (
            <Text key={index} style={styles.infoText}>{table.name}</Text>
          ))}
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Veritabanı Bilgisi:</Text>
          <Text style={styles.infoText}>Yol: {dbInfo.dbPath || 'Bilinmiyor'}</Text>
          <Text style={styles.infoText}>Toplam görev sayısı: {dbInfo.taskCount || 0}</Text>
          <Text style={styles.infoText}>Context'teki görev sayısı: {tasks.length}</Text>
          <Text style={styles.infoText}>Pomodoro oturumları: {pomodoroCount}</Text>
          <Text style={styles.infoText}>AI Analiz kayıtları: {aiAnalysisCount}</Text>
          <Text style={styles.infoText}>StatisticsContext durumu: {isLoading ? 'Yükleniyor...' : 'Hazır'}</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={checkDatabase}>
          <Text style={styles.buttonText}>Veritabanını Yenile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={generateTestData}>
          <Text style={styles.buttonText}>Test Verileri Oluştur</Text>
        </TouchableOpacity>
      </View>
      
      {statsData.dailyStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İstatistik Verileri</Text>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Bugünkü İstatistikler:</Text>
            <Text style={styles.statInfo}>Tarih: {statsData.dailyStats.date}</Text>
            <Text style={styles.statInfo}>Toplam Pomodoro: {statsData.dailyStats.totalPomodoros}</Text>
            <Text style={styles.statInfo}>Tamamlanan Pomodoro: {statsData.dailyStats.completedPomodoros}</Text>
            <Text style={styles.statInfo}>Toplam Odaklanma Süresi: {Math.round(statsData.dailyStats.totalFocusTime / 60)} dakika</Text>
            <Text style={styles.statInfo}>Görevler: {statsData.dailyStats.tasks.completed}/{statsData.dailyStats.tasks.total}</Text>
            <Text style={styles.statInfo}>En Verimli Saat: {statsData.dailyStats.mostProductiveHour || 'Veri yok'}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Haftalık İstatistikler:</Text>
            <Text style={styles.statInfo}>Tarih Aralığı: {statsData.weeklyStats.startDate} - {statsData.weeklyStats.endDate}</Text>
            <Text style={styles.statInfo}>Toplam Pomodoro: {statsData.weeklyStats.totalPomodoros}</Text>
            <Text style={styles.statInfo}>Tamamlanan Pomodoro: {statsData.weeklyStats.completedPomodoros}</Text>
            <Text style={styles.statInfo}>Toplam Odaklanma Süresi: {Math.round(statsData.weeklyStats.totalFocusTime / 60)} dakika</Text>
            <Text style={styles.statInfo}>Görevler: {statsData.weeklyStats.tasks.completed}/{statsData.weeklyStats.tasks.total}</Text>
            <Text style={styles.statInfo}>En Verimli Gün: {statsData.weeklyStats.mostProductiveDay || 'Veri yok'}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Aylık İstatistikler:</Text>
            <Text style={styles.statInfo}>Ay: {format(new Date(statsData.monthlyStats.year, statsData.monthlyStats.month - 1), 'MMMM yyyy', { locale: tr })}</Text>
            <Text style={styles.statInfo}>Toplam Pomodoro: {statsData.monthlyStats.totalPomodoros}</Text>
            <Text style={styles.statInfo}>Tamamlanan Pomodoro: {statsData.monthlyStats.completedPomodoros}</Text>
            <Text style={styles.statInfo}>Toplam Odaklanma Süresi: {Math.round(statsData.monthlyStats.totalFocusTime / 60)} dakika</Text>
            <Text style={styles.statInfo}>Görevler: {statsData.monthlyStats.tasks.completed}/{statsData.monthlyStats.tasks.total}</Text>
            <Text style={styles.statInfo}>Toplam Hafta Sayısı: {statsData.monthlyStats.weeks.length}</Text>
          </View>
        </View>
      )}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Örnek Görevler (MAX 10)</Text>
        
        {dbInfo.sampleTasks?.map((task: any, index: number) => (
          <View key={index} style={styles.taskCard}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskInfo}>ID: {task.id}</Text>
            <Text style={styles.taskInfo}>Durum: {task.is_completed ? '✅ Tamamlandı' : '🔄 Devam Ediyor'}</Text>
            <Text style={styles.taskInfo}>Pomodoro: {task.completed_pomodoros}/{task.pomodoro_count}</Text>
            <Text style={styles.taskInfo}>Oluşturulma: {task.created_at}</Text>
          </View>
        ))}
      </View>
      
      {dbInfo.samplePomodoros && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Örnek Pomodoro Oturumları (MAX 10)</Text>
          
          {dbInfo.samplePomodoros?.map((session: any, index: number) => (
            <View key={index} style={styles.sessionCard}>
              <Text style={styles.sessionInfo}>ID: {session.id}</Text>
              <Text style={styles.sessionInfo}>Tarih: {session.date}</Text>
              <Text style={styles.sessionInfo}>Süre: {session.duration / 60} dakika</Text>
              <Text style={styles.sessionInfo}>Saat: {session.time_of_day}:00</Text>
              <Text style={styles.sessionInfo}>Durum: {session.completed ? '✅ Tamamlandı' : '❌ Yarıda Kaldı'}</Text>
              <Text style={styles.sessionInfo}>Görev ID: {session.task_id || 'Yok'}</Text>
            </View>
          ))}
        </View>
      )}
      
      {dbInfo.sampleAiAnalysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yapay Zeka Analiz Kayıtları (MAX 5)</Text>
          
          {dbInfo.sampleAiAnalysis?.map((analysis: any, index: number) => (
            <View key={index} style={styles.aiCard}>
              <Text style={styles.aiInfo}>ID: {analysis.id}</Text>
              <Text style={styles.aiInfo}>Dönem Tipi: {analysis.period_type}</Text>
              <Text style={styles.aiInfo}>Dönem Değeri: {analysis.period_value}</Text>
              <Text style={styles.aiInfo}>Tarih: {analysis.date}</Text>
              <Text style={styles.aiInfo}>İçerik:</Text>
              <Text style={styles.aiContent} numberOfLines={3} ellipsizeMode="tail">
                {analysis.analysis_text}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      {dbInfo.sampleFolders && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Not Klasörleri ({dbInfo.folderCount || 0})</Text>
          
          {dbInfo.sampleFolders?.map((folder: any, index: number) => (
            <View key={index} style={styles.folderCard}>
              <Text style={styles.folderName}>{folder.name}</Text>
              <Text style={styles.folderInfo}>ID: {folder.id}</Text>
              <Text style={styles.folderInfo}>Renk: {folder.color || 'Yok'}</Text>
              <Text style={styles.folderInfo}>Oluşturulma: {folder.created_at}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#555',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  testButton: {
    backgroundColor: '#34C759',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  taskCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  taskInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff0f5',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b8a',
  },
  sessionInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f0fff0',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E7D32',
  },
  statInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  aiCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  aiInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  aiContent: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  folderCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  folderName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  folderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
