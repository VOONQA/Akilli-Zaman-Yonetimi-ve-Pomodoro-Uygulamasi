import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  ListRenderItem,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { YouTubeVideo } from '../../types/youtube';
import { useYouTube } from '../../context/YouTubeContext';

interface YouTubeVideoListProps {
  videos: YouTubeVideo[];
  onVideoPress: (video: YouTubeVideo) => void;
  loading?: boolean;
  error?: string | null;
  onEndReached?: () => void;
}

const YouTubeVideoList: React.FC<YouTubeVideoListProps> = ({ 
  videos, 
  onVideoPress,
  loading,
  error,
  onEndReached
}) => {
  const { 
    isVideoSaved, 
    saveVideoToList, 
    removeVideoFromList, 
    currentVideo
  } = useYouTube();

  const handleSaveVideo = async (video: YouTubeVideo) => {
    if (isVideoSaved(video.id)) {
      await removeVideoFromList(video.id);
    } else {
      await saveVideoToList(video);
    }
  };

  const renderItem: ListRenderItem<YouTubeVideo> = ({ item }) => (
    <View style={[
      styles.videoItem,
      currentVideo?.id === item.id && styles.selectedVideoItem
    ]}>
      <TouchableOpacity
        style={styles.thumbnailContainer}
        onPress={() => onVideoPress(item)}
      >
        <Image 
          source={{ uri: item.thumbnail }} 
          style={styles.thumbnail} 
          resizeMode="cover"
        />
      </TouchableOpacity>
      
      <View style={styles.videoInfo}>
        <TouchableOpacity onPress={() => onVideoPress(item)}>
          <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
        
        <Text style={styles.channelTitle}>{item.channelTitle}</Text>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSaveVideo(item)}
        >
          <Ionicons
            name={isVideoSaved(item.id) ? "bookmark" : "bookmark-outline"}
            size={16}
            color={isVideoSaved(item.id) ? "#FF0000" : "#666"}
          />
          <Text style={styles.saveButtonText}>
            {isVideoSaved(item.id) ? "Kaydedildi" : "Kaydet"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.emptyText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF0000" />
        <Text style={styles.emptyText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Video bulunamadı</Text>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 10,
  },
  videoItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedVideoItem: {
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF0000',
  },
  thumbnailContainer: {
    width: 120,
    height: 80,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  videoInfo: {
    flex: 1,
    padding: 8,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  channelTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});

export default YouTubeVideoList;
