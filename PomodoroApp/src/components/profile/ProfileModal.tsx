import React, { useRef, useEffect } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  PanResponder,
  TouchableWithoutFeedback 
} from 'react-native';
import ProfileScreen from '../../screens/profile/ProfileScreen';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height } = Dimensions.get('window');

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  // Animasyon değerleri
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Modal görünürlüğü değiştiğinde animasyonu başlat
  useEffect(() => {
    if (visible) {
      // Modal açılıyor
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Modal kapanıyor
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  // Kaydırma hareketi için PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          // Sadece aşağı doğru sürüklendiğinde hareket ettir
          slideAnim.setValue(gesture.dy);
          // Arkaplan opaklığını da güncelle
          backdropOpacity.setValue(0.5 - (gesture.dy / (height * 2)));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) {
          // Yeterince aşağı çekilirse modalı kapat
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: height,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            onClose();
          });
        } else {
          // Yeteri kadar aşağı çekilmezse eski konumuna geri getir
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: backdropOpacity }
          ]} 
        />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.modalHandle} />
        <ProfileScreen onClose={onClose} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: '#000',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '95%',
    paddingTop: 10,
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 5,
  }
});

export default ProfileModal;
