import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderProps {
  totalFocusTime: number;
  completionRate: number;
  totalBadges: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  totalFocusTime,
  completionRate,
  totalBadges,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImage}>
          <Ionicons name="person" size={40} color="#ffffff" />
        </View>
      </View>
      
      <Text style={styles.userName}>Pomodoro Kullanıcısı</Text>
      
      {/* Sadece rozet sayısını gösterelim */}
      <View style={styles.badgeCountContainer}>
        <Ionicons name="ribbon" size={18} color="#4a6da7" />
        <Text style={styles.badgeCountText}>{totalBadges} Rozet Kazanıldı</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileImageContainer: {
    marginBottom: 10,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  badgeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  badgeCountText: {
    fontSize: 12,
    color: '#4a6da7',
    fontWeight: '500',
    marginLeft: 5,
  },
});

export default ProfileHeader;
