import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat, Message } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatModal: React.FC = () => {
  const { isVisible, setIsVisible, messages, sendMessage, isTyping, clearChat } = useChat();
  const [inputText, setInputText] = useState('');
  
  // Animasyon değerleri
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  // Modal görünürlüğü değiştiğinde animasyonu başlat
  useEffect(() => {
    if (isVisible) {
      // Modal açılıyor
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      }).start();
    } else {
      // Reset değerleri
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [isVisible]);
  
  // Dokunma işlemleri için panResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Sadece aşağı kaydırma hareketlerini yakala
        return gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Sadece aşağı kaydırmaya izin ver
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Yeterince aşağı kaydırıldı, modalı kapat
          closeModal();
        } else {
          // Yeterli kaydırma yoksa, modalı geri getir
          Animated.spring(translateY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;
  
  // Modalı kapat
  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      setIsVisible(false);
    });
  };
  
  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage
      text={item.text}
      isUser={item.user._id === 1}
      timestamp={new Date(item.createdAt)}
    />
  );

  // Modal görünür değilse hiçbir şey render etme
  if (!isVisible) return null;

  return (
    <View style={styles.modalContainer}>
      <Animated.View 
        style={[
          styles.container,
          { transform: [{ translateY }] }
        ]}
      >
        {/* Sürükleme kolu */}
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragIndicator} />
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pomodoro Asistan</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={clearChat}
              style={styles.clearButton}
            >
              <Ionicons name="trash-outline" size={22} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={closeModal}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mesaj listesi */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item._id.toString()}
          inverted
          style={styles.messageList}
        />

        {/* Yazıyor göstergesi */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#5E60CE" />
            <Text style={styles.typingText}>Yazıyor...</Text>
          </View>
        )}

        {/* Mesaj giriş alanı */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Mesajınızı yazın..."
            multiline
          />
          <TouchableOpacity 
            onPress={handleSend}
            style={styles.sendButton}
            disabled={isTyping || !inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={isTyping || !inputText.trim() ? "#ccc" : "#5E60CE"} 
            />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Animated.View>
      
      {/* Arka plan overlay - dışarıya tıklayarak kapatma */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={closeModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: -1,
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: '95%', // Modal ekranın %95'ini kaplasın
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // iOS için ekstra padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  dragHandleContainer: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDDDDD',
  },
  header: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 5,
  },
  clearButton: {
    padding: 5,
    marginRight: 10,
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 5,
  },
  typingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatModal;
