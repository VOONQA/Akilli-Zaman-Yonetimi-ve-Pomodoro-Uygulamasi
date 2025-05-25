import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useYouTube } from '../../context/YouTubeContext';
import YouTubePlayer from './YouTubePlayer';
import YouTubeVideoList from './YouTubeVideoList';
import YouTubeSearchBar from './YouTubeSearchBar';
import YouTubeCategory from './YouTubeCategory';
import YouTubeChannelScreen from './YouTubeChannelScreen';
import YouTubeSearchResults from './YouTubeSearchResults';
import { searchYouTube } from '../../services/youtubeService';
import { YouTubeVideo, YouTubeChannel } from '../../types/youtube';

interface YouTubeModalProps {
  onClose?: () => void;
}

const YouTubeModal: React.FC<YouTubeModalProps> = ({ onClose }) => {
  const { 
    isYouTubeModalVisible, 
    setYouTubeModalVisible, 
    currentVideo,
    setCurrentVideo,
    isPlaying,
    setIsPlaying,
    selectedCategory,
    setSelectedCategory,
    loadVideos,
    videosByCategory,
    minimizePlayer,
    setMinimizePlayer,
    videoProgress,
    setVideoProgress,
    loading,
    setLoading,
    error,
    setError
  } = useYouTube();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [channelResults, setChannelResults] = useState<YouTubeChannel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showChannelScreen, setShowChannelScreen] = useState(false);

  // Seçilen kategori değiştiğinde videoları yükle
  useEffect(() => {
    if (isYouTubeModalVisible && !minimizePlayer && !showChannelScreen) {
      loadVideos(selectedCategory);
    }
  }, [isYouTubeModalVisible, selectedCategory, minimizePlayer, showChannelScreen]);

  const handleCloseModal = () => {
    if (currentVideo) {
      // Modal kapatıldığında oynatmaya devam et, sadece minimize et
      setMinimizePlayer(true);
      setYouTubeModalVisible(false);
      // İlerlemeyi kaydet ama oynatmayı durdurmayalım
    } else {
      // Video yoksa, modalı tamamen kapat
      setYouTubeModalVisible(false);
      setMinimizePlayer(false);
      setCurrentVideo(null);
      setIsPlaying(false);
      onClose?.();
    }
  };

  const handleExpandModal = () => {
    // Mini oynatıcıdan ana modalı açarken ayarları güncelle
    setMinimizePlayer(false);
    setYouTubeModalVisible(true);
    // Video kontrolünü dokunmayalım, kullanıcı kendi kontrol etsin
  };

  const handleStopVideo = () => {
    // Video tamamen kapatıldığında
    setIsPlaying(false);
    setCurrentVideo(null);
    setYouTubeModalVisible(false);
    setMinimizePlayer(false);
    setVideoProgress(0);
    onClose?.();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { videos, channels } = await searchYouTube(searchQuery);
      setSearchResults(videos);
      setChannelResults(channels);
      setIsSearching(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setError('Arama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setChannelResults([]);
  };

  const handleChannelPress = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowChannelScreen(true);
  };

  const handleBackFromChannel = () => {
    setShowChannelScreen(false);
    setSelectedChannelId(null);
  };

  const handleVideoPress = (video: YouTubeVideo) => {
    setCurrentVideo(video);
    setIsPlaying(true);
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={false}
        visible={isYouTubeModalVisible}
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.safeContainer}>
          <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {showChannelScreen && selectedChannelId ? (
              <YouTubeChannelScreen 
                channelId={selectedChannelId}
                onBack={handleBackFromChannel}
              />
            ) : (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>YouTube</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={handleCloseModal}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <YouTubeSearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmit={handleSearch}
                  onClear={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                    setSearchResults([]);
                    setChannelResults([]);
                  }}
                />

                {!isSearching && (
                  <YouTubeCategory
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleCategorySelect}
                  />
                )}

                <View style={styles.contentContainer}>
                  {currentVideo && (
                    <View style={styles.playerContainer}>
                      <YouTubePlayer
                        videoId={currentVideo.id}
                        isPlaying={isPlaying}
                        onPlaybackStatusChange={setIsPlaying}
                        onProgressChange={setVideoProgress}
                        initialProgress={videoProgress}
                      />
                      <TouchableOpacity 
                        style={styles.closeVideoButton} 
                        onPress={() => {
                          setCurrentVideo(null);
                          setIsPlaying(false);
                          setVideoProgress(0);
                        }}
                      >
                        <Ionicons name="close-circle" size={28} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={[styles.videoListContainer, { marginTop: currentVideo ? 10 : 0 }]}>
                    {isSearching ? (
                      <YouTubeSearchResults
                        videos={searchResults}
                        channels={channelResults}
                        onVideoPress={handleVideoPress}
                        onChannelPress={handleChannelPress}
                        loading={loading}
                        error={error}
                      />
                    ) : (
                      <>
                        <Text style={styles.sectionTitle}>
                          {selectedCategory}
                        </Text>
                        <YouTubeVideoList
                          videos={videosByCategory[selectedCategory] || []}
                          onVideoPress={(video) => {
                            setCurrentVideo(video);
                            setIsPlaying(true);
                          }}
                          loading={loading}
                          error={error}
                        />
                      </>
                    )}
                  </View>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Minimize edilmiş oynatıcı */}
      {minimizePlayer && currentVideo && (
        <TouchableOpacity 
          style={styles.miniPlayerContainer}
          onPress={handleExpandModal}
        >
          {/* Mini oynatıcı kodu */}
          {/* ... */}
        </TouchableOpacity>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  contentContainer: {
    flex: 1,
  },
  videoListContainer: {
    flex: 1,
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  closeVideoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
    marginVertical: 8,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default YouTubeModal;
