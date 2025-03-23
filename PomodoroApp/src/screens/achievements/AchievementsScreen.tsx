import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RootScreenProps } from '../../navigation/navigationTypes';

type Props = RootScreenProps<'AchievementsScreen'>;

const AchievementsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Başarılar</Text>
      <Text>Kazanılan başarılar burada listelenecek</Text>
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

export default AchievementsScreen;