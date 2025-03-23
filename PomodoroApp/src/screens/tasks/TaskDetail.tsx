import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RootScreenProps } from '../../navigation/navigationTypes';

type Props = RootScreenProps<'TaskDetail'>;

const TaskDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { taskId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Görev Detayı</Text>
      <Text>Görev ID: {taskId}</Text>
      <Button 
        title="Görevi Düzenle" 
        onPress={() => navigation.navigate('EditTask', { taskId })}
      />
      <Button 
        title="Geri Dön" 
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default TaskDetailScreen;