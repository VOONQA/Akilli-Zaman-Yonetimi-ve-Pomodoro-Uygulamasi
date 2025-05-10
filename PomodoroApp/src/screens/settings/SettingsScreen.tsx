import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../../navigation/navigationTypes';
import ProfileScreen from '../profile/ProfileScreen';

type Props = TabScreenProps<'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const openProfileModal = () => {
    setProfileModalVisible(true);
  };

  const closeProfileModal = () => {
    setProfileModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={openProfileModal}
        >
          <Ionicons name="person-circle-outline" size={28} color="#4a6da7" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Button 
          title="Zamanlayıcı Ayarları" 
          onPress={() => {
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

      {/* Profil Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={profileModalVisible}
        onRequestClose={closeProfileModal}
      >
        <ProfileScreen onClose={closeProfileModal} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
});

export default SettingsScreen;