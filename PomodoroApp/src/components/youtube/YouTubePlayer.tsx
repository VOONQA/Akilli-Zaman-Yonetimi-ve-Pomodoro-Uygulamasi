import React, { useRef, useEffect, useState } from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Dimensions, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onPlaybackStatusChange: (status: boolean) => void;
  onProgressChange: (progress: number) => void;
  initialProgress?: number;
  onClose?: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  isPlaying,
  onPlaybackStatusChange,
  onProgressChange,
  initialProgress = 0,
  onClose
}) => {
  const playerRef = useRef<any>(null);
  const screenWidth = Dimensions.get('window').width;
  const [isReady, setIsReady] = useState(false);
  
  // Video hazır olduğunda
  const handlePlayerReady = () => {
    setIsReady(true);
    
    // Video hazır olduğunda ve başlangıç değeri varsa, o noktadan başlat
    if (initialProgress > 0 && playerRef.current) {
      playerRef.current.seekTo(initialProgress, true);
    }
  };
  
  // Video durumu değiştiğinde
  const handleStateChange = (state: string) => {
    if (state === 'ended') {
      onPlaybackStatusChange(false);
    } else if (state === 'playing' || state === 'paused') {
      onPlaybackStatusChange(state === 'playing');
      
      // Video oynatılmaya başladığında ilerlemeyi düzenli kontrol etmek için
      if (state === 'playing') {
        startProgressTracking();
      }
    }
  };
  
  // İlerleme takibi için
  const startProgressTracking = () => {
    // İlerlemeyi sadece 5 saniyede bir kontrol edelim, çok sık çağrı yapmayalım
    const progressInterval = setInterval(async () => {
      if (playerRef.current && isPlaying) {
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          if (typeof currentTime === 'number') {
            onProgressChange(currentTime);
          }
        } catch (error) {
          console.log('İlerleme alınamadı');
        }
      }
    }, 5000); // 5 saniyede bir kontrol et
    
    // Interval'ı temizle
    return () => clearInterval(progressInterval);
  };
  
  // Video ID'si değiştiğinde
  useEffect(() => {
    // Video ID değiştiğinde playerRef reset olur, isReady false olur
    setIsReady(false);
  }, [videoId]);

  return (
    <View style={styles.container}>
      <YoutubePlayer
        ref={playerRef}
        height={300}
        width={screenWidth}
        videoId={videoId}
        play={isPlaying}
        onReady={handlePlayerReady}
        onChangeState={handleStateChange}
        initialPlayerParams={{
          preventFullScreen: false,
          showClosedCaptions: false,
          controls: true,
          modestbranding: true,
          rel: false,
        }}
        webViewProps={{
          androidLayerType: Platform.OS === 'android' ? 'hardware' : undefined,
          renderToHardwareTextureAndroid: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          javaScriptEnabled: true,
        }}
        webViewStyle={{ opacity: 0.99 }}
      />
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
});

export default YouTubePlayer;
