import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../../models/Task';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress, 
  selectionMode = false,
  isSelected = false,
  onLongPress
}) => {
  return (
    <View
      style={[
        styles.container,
        task.isCompleted && styles.completedContainer,
        isSelected && styles.selectedContainer
      ]}
    >
      <TouchableOpacity 
        style={styles.taskTouchable}
        onPress={onPress}
        onLongPress={() => onLongPress && onLongPress(task.id)}
        delayLongPress={300}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            ) : (
              <Ionicons name="ellipse-outline" size={24} color="#666" />
            )}
          </View>
        )}
        
        <View style={[
          styles.contentContainer,
          selectionMode ? {} : { marginLeft: 12 }
        ]}>
          <Text 
            style={[
              styles.title,
              task.isCompleted && styles.completedTitle
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          
          {task.description ? (
            <Text 
              style={[
                styles.description,
                task.isCompleted && styles.completedDescription
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}
          
          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.dateText}>
                {new Date(task.date).toLocaleDateString('tr-TR')}
              </Text>
            </View>
            
            <View style={styles.pomodoroContainer}>
              <Ionicons name="timer-outline" size={14} color="#666" />
              <Text style={styles.pomodoroText}>
                {task.completedPomodoros}/{task.pomodoroCount}
              </Text>
            </View>
            
            {task.isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color="#ccc"
          style={styles.arrowIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  taskTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  completedContainer: {
    backgroundColor: '#f0f0f0',
  },
  selectedContainer: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  checkboxContainer: {
    marginRight: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  completedDescription: {
    color: '#aaa',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  pomodoroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pomodoroText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default TaskItem;
