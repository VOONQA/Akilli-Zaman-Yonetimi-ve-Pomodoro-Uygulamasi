import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareButtonProps {
  badgeName?: string;
  badgeLevel?: string;
  message?: string;
  style?: object;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  badgeName,
  badgeLevel,
  message,
  style,
}) => {
  const handleShare = async () => {
    try {
      let shareMessage = 'Pomodoro App\'te başarılarımı paylaşıyorum!';
      
      if (badgeName && badgeLevel) {
        shareMessage = `🏆 ${badgeName} rozetinin ${badgeLevel} seviyesini kazandım! #PomodoroApp'te çalışmalarımı sürdürüyorum.`;
      } else if (message) {
        shareMessage = message;
      }
      
      await Share.share({
        message: shareMessage,
        title: 'Pomodoro App Başarılarım',
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleShare}
      activeOpacity={0.7}
    >
      <Ionicons name="share-social-outline" size={18} color="#4a6da7" />
      <Text style={styles.text}>Paylaş</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: '#4a6da7',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ShareButton;
