import React from 'react';
import { TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useChat } from '../../context/ChatContext';

// Bot avatarını burada import ediyoruz
const botAvatar = require('../../../assets/images/bot-avatar.png');

const ChatButton: React.FC = () => {
  const { setIsVisible } = useChat();

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={() => setIsVisible(true)}
    >
      {/* İkon yerine bot avatarını kullanıyoruz */}
      <Image 
        source={botAvatar} 
        style={styles.avatar} 
        // Resim yüklenmezse hata vermemesi için
        defaultSource={{uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='}}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 120, // 70'den 120'ye çıkardım
    backgroundColor: '#5E60CE',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    overflow: 'hidden', // Resmin dışa taşmaması için
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  }
});

export default ChatButton;
