import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TabScreenProps } from '../../navigation/navigationTypes';

type Props = TabScreenProps<'Statistics'>;

const StatsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>İstatistikler</Text>
      <Text>İstatistik ve analiz grafikleri burada olacak</Text>
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

export default StatsScreen;