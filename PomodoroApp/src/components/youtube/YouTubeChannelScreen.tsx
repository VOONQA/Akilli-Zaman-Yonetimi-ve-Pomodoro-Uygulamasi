import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  FlatList,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useYouTube } from '../../context/YouTubeContext';
import YouTubePlayer from './YouTubePlayer';
import { getChannelVideos, getChannelDetails } from '../../services/youtubeService';
import { YouTubeVideo } from '../../types/youtube';

interface YouTubeChannelScreenProps {
  channelId: string;
  onBack: () => void;
}

const YouTubeChannelScreen: React.FC<YouTubeChannelScreenProps> = ({ 
  channelId, 
  onBack 
}) => {
  const { 
    setCurrentVideo,
    isPlaying,
    setIsPlaying,
    currentVideo,
    videoProgress,
    setVideoProgress
  } = useYouTube();

  const [channelDetails, setChannelDetails] = useState<any>(null);
  const [channelVideos, setChannelVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const loadChannelData = async () => {
      if (!channelId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [details, videosResponse] = await Promise.all([
          getChannelDetails(channelId),
          getChannelVideos(channelId)
        ]);
        
        if (details) {
          setChannelDetails(details);
        } else {
          setError('Kanal bilgileri yüklenemedi');
        }
        
        if (videosResponse && videosResponse.videos) {
          setChannelVideos(videosResponse.videos);
          setNextPageToken(videosResponse.nextPageToken || null);
          setCanLoadMore(!!videosResponse.nextPageToken);
        } else {
          setError('Kanal videoları yüklenemedi');
        }
      } catch (err) {
        console.error('Kanal yüklenirken hata:', err);
        setError('Kanal bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    loadChannelData();
  }, [channelId]);

  const loadMoreVideos = async () => {
    if (!nextPageToken || loadingMore || !canLoadMore || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setLoadingMore(true);
    
    try {
      const videosResponse = await getChannelVideos(channelId, nextPageToken);
      
      if (videosResponse && videosResponse.videos) {
        if (videosResponse.videos.length > 0) {
          setChannelVideos(prev => [...prev, ...videosResponse.videos]);
          setNextPageToken(videosResponse.nextPageToken || null);
          
          setCanLoadMore(!!videosResponse.nextPageToken);
        } else {
          setCanLoadMore(false);
        }
      } else {
        setCanLoadMore(false);
      }
    } catch (err) {
      console.error('Daha fazla video yüklenirken hata:', err);
      setCanLoadMore(false);
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const handleVideoSelect = (video: YouTubeVideo) => {
    setCurrentVideo(video);
    setIsPlaying(true);
  };

  const handleCloseVideo = () => {
    setCurrentVideo(null);
    setIsPlaying(false);
    setVideoProgress(0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Kanal yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF0000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {channelDetails?.title || 'Kanal'}
        </Text>
      </View>

      {channelDetails && (
        <View style={styles.channelInfoContainer}>
          <Image 
            source={{ uri: channelDetails.thumbnail }} 
            style={styles.channelAvatar} 
          />
          <View style={styles.channelDetails}>
            <Text style={styles.channelTitle}>{channelDetails.title}</Text>
            <Text style={styles.subscriberCount}>
              {formatSubscriberCount(channelDetails.subscriberCount)} abone
            </Text>
            <Text style={styles.videoCount}>
              {channelDetails.videoCount} video
            </Text>
          </View>
        </View>
      )}

      {channelDetails && channelDetails.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText} numberOfLines={3}>
            {channelDetails.description}
          </Text>
        </View>
      )}

      {currentVideo && (
        <View style={styles.playerContainer}>
          <YouTubePlayer
            videoId={currentVideo.id}
            isPlaying={isPlaying}
            onPlaybackStatusChange={setIsPlaying}
            onProgressChange={setVideoProgress}
            initialProgress={videoProgress}
            onClose={handleCloseVideo}
          />
        </View>
      )}

      <View style={styles.videoListHeader}>
        <Text style={styles.videoListTitle}>Videolar</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#FF0000" />
        <Text style={styles.loadMoreText}>Daha fazla video yükleniyor...</Text>
      </View>
    );
  };

  const renderVideo = ({ item }: { item: YouTubeVideo }) => (
    <TouchableOpacity 
      style={styles.videoItem}
      onPress={() => handleVideoSelect(item)}
    >
      <Image 
        source={{ uri: item.thumbnail }} 
        style={styles.videoThumbnail} 
      />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoChannel}>{item.channelTitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={channelVideos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={canLoadMore ? loadMoreVideos : undefined}
        onEndReachedThreshold={0.3}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

const formatSubscriberCount = (count: string): string => {
  const num = parseInt(count, 10);
  if (isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}B`;
  }
  
  return num.toString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  channelInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  channelAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  channelDetails: {
    flex: 1,
    marginLeft: 15,
  },
  channelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subscriberCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  videoCount: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  videoListHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  videoListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  videoListContainer: {
    flex: 2,
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 10,
  },
  videoItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  videoThumbnail: {
    width: 120,
    height: 75,
    borderRadius: 5,
  },
  videoInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoChannel: {
    fontSize: 14,
    color: '#666',
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default YouTubeChannelScreen;