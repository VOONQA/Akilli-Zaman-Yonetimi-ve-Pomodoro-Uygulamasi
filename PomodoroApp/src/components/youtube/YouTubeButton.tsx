import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useYouTube } from '../../context/YouTubeContext';

interface YouTubeButtonProps {
  style?: object;
}

const YouTubeButton: React.FC<YouTubeButtonProps> = ({ style }) => {
  const { setYouTubeModalVisible, minimizePlayer, setMinimizePlayer } = useYouTube();

  const handlePress = () => {
    if (minimizePlayer) {
      setMinimizePlayer(false);
    }
    setYouTubeModalVisible(true);
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <Ionicons name="logo-youtube" size={24} color="#FF0000" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
});

export default YouTubeButton;
