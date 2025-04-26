import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Task } from '../../models/Task';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onTaskPress: (taskId: string) => void;
  emptyMessage?: string;
  selectionMode?: boolean;
  selectedTasks?: {[key: string]: boolean};
  onToggleSelection?: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  loading = false, 
  onTaskPress, 
  emptyMessage = 'Görev bulunamadı',
  selectionMode = false,
  selectedTasks = {},
  onToggleSelection
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onPress={() => onTaskPress(item.id)}
          selectionMode={selectionMode}
          isSelected={selectedTasks[item.id] || false}
          onLongPress={onToggleSelection}
        />
      )}
      keyExtractor={item => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});

export default TaskList;
