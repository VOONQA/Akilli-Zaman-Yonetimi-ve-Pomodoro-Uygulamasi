import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RootScreenProps } from '../../navigation/navigationTypes';

type Props = RootScreenProps<'EditTask'>;

const EditTaskScreen: React.FC<Props> = ({ route, navigation }) => {
  const { taskId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{taskId ? 'Görevi Düzenle' : 'Yeni Görev'}</Text>
      {taskId && <Text>Görev ID: {taskId}</Text>}
      <Button 
        title="Kaydet" 
        onPress={() => navigation.goBack()}
      />
      <Button 
        title="İptal" 
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

export default EditTaskScreen;