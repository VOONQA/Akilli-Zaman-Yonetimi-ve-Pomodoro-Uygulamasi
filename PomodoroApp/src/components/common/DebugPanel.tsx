import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTask } from '../../context/TaskContext';
import { openDatabase, getDatabasePath } from '../../services/database';

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
  const [dbInfo, setDbInfo] = useState<any>({});
  const [tables, setTables] = useState<TableInfo[]>([]);
  
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
    } catch (error) {
      console.error('Veritabanı kontrol hatası:', error);
      setDbInfo({ error: JSON.stringify(error) });
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
        </View>
        
        <TouchableOpacity style={styles.button} onPress={checkDatabase}>
          <Text style={styles.buttonText}>Veritabanını Yenile</Text>
        </TouchableOpacity>
      </View>
      
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
});
