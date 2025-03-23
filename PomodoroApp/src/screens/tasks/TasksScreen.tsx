import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { TabScreenProps } from '../../navigation/navigationTypes';

type Props = TabScreenProps<'Tasks'>;

const TasksScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Görevler</Text>
      <Text>Görev listesi burada olacak</Text>
      <Button 
        title="Yeni Görev Ekle" 
        onPress={() => {
          // CompositeNavigation ile artık doğrudan stack navigasyon rotalarına erişebiliriz
          navigation.navigate('EditTask', { taskId: undefined });
        }}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default TasksScreen;