import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RootScreenProps } from '../../navigation/navigationTypes';

type Props = RootScreenProps<'NotificationsSettingsScreen'>;

const NotificationsSettingsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bildirim Ayarları</Text>
      <Text>Bildirim ayarları burada olacak</Text>
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

export default NotificationsSettingsScreen;