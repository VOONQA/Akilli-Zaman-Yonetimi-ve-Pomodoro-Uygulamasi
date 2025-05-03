import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessageProps {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Bot avatarını bileşen içinde import edelim
const botAvatar = require('../../../assets/images/bot-avatar.png');

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  text, 
  isUser, 
  timestamp 
}) => {
  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          {/* Resim dosyasını burada kullanıyoruz */}
          <Image 
            source={botAvatar} 
            style={styles.avatar} 
            // Resim yüklenmezse ikon göster
            defaultSource={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='}}
          />
        </View>
      )}
      <View style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.text,
          isUser ? styles.userText : styles.botText
        ]}>
          {text}
        </Text>
        <Text style={styles.timestamp}>
          {timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  botContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 8,
    backgroundColor: '#f0f0f0', // Arkaplan rengi
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#FF5722',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 5,
  },
  text: {
    fontSize: 16,
    marginBottom: 4,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 10,
    color: '#888888',
    alignSelf: 'flex-end',
  },
});

export default ChatMessage;