import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { TabScreenProps } from '../../navigation/navigationTypes';

type Props = TabScreenProps<'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ayarlar</Text>
      
      <Button 
        title="Zamanlayıcı Ayarları" 
        onPress={() => {
          // CompositeNavigation ile artık doğrudan stack navigasyon rotalarına erişebiliriz
          navigation.navigate('TimerSettingsScreen');
        }}
      />
      
      <Button 
        title="Bildirim Ayarları" 
        onPress={() => {
          navigation.navigate('NotificationsSettingsScreen');
        }}
      />
      
      <Button 
        title="Başarılar" 
        onPress={() => {
          navigation.navigate('AchievementsScreen');
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
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default SettingsScreen;