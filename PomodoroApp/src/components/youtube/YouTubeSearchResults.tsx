import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { YouTubeVideo, YouTubeChannel } from '../../types/youtube';

interface Props {
  videos: YouTubeVideo[];
  channels: YouTubeChannel[];
  loading: boolean;
  onVideoPress: (video: YouTubeVideo) => void;
  onChannelPress: (channelId: string) => void;
  error?: string | null;
}

// Item türlerini açıkça belirtelim
type ChannelHeaderItem = { type: 'channelHeader' };
type VideoHeaderItem = { type: 'videoHeader' };
type ChannelItem = { type: 'channel'; data: YouTubeChannel };
type VideoItem = { type: 'video'; data: YouTubeVideo };
type ListItem = ChannelHeaderItem | VideoHeaderItem | ChannelItem | VideoItem;

const YouTubeSearchResults: React.FC<Props> = ({
  videos,
  channels,
  loading,
  onVideoPress,
  onChannelPress,
  error
}) => {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Aranıyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (videos.length === 0 && channels.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noResultsText}>Sonuç bulunamadı</Text>
      </View>
    );
  }

  // Ve sonra veri oluştururken bunları kullanalım:
  const allItems: ListItem[] = [
    ...(channels.length > 0 ? [{ type: 'channelHeader' } as ChannelHeaderItem] : []),
    ...channels.map(channel => ({ type: 'channel', data: channel } as ChannelItem)),
    ...(videos.length > 0 ? [{ type: 'videoHeader' } as VideoHeaderItem] : []),
    ...videos.map(video => ({ type: 'video', data: video } as VideoItem))
  ];

  return (
    <FlatList
      data={allItems}
      keyExtractor={(item, index) => {
        if (item.type === 'channelHeader') return 'channelHeader';
        if (item.type === 'videoHeader') return 'videoHeader';
        if (item.type === 'channel') return `channel-${item.data.id}`;
        if (item.type === 'video') return `video-${item.data.id}`;
        return `item-${index}`;
      }}
      renderItem={({ item }) => {
        if (item.type === 'channelHeader') {
          return <Text style={styles.sectionHeader}>Kanallar</Text>;
        }
        
        if (item.type === 'videoHeader') {
          return <Text style={styles.sectionHeader}>Videolar</Text>;
        }
        
        if (item.type === 'channel') {
          const channel = item.data;
          return (
            <TouchableOpacity 
              style={styles.channelItem}
              onPress={() => onChannelPress(channel.id)}
            >
              <Image 
                source={{ uri: channel.thumbnail }} 
                style={styles.channelImage} 
              />
              <View style={styles.channelInfo}>
                <Text style={styles.channelTitle} numberOfLines={1}>{channel.title}</Text>
                <Text style={styles.channelDescription} numberOfLines={2}>{channel.description}</Text>
              </View>
            </TouchableOpacity>
          );
        }
        
        if (item.type === 'video') {
          const video = item.data;
          return (
            <TouchableOpacity 
              style={styles.videoItem}
              onPress={() => onVideoPress(video)}
            >
              <Image 
                source={{ uri: video.thumbnail }} 
                style={styles.videoThumbnail} 
              />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                <Text style={styles.channelName}>{video.channelTitle}</Text>
              </View>
            </TouchableOpacity>
          );
        }
        
        return null;
      }}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center'
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0'
  },
  channelItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  channelImage: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  channelInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center'
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  channelDescription: {
    fontSize: 14,
    color: '#666'
  },
  videoItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  videoThumbnail: {
    width: 120,
    height: 75,
    borderRadius: 5
  },
  videoInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center'
  },
  videoTitle: {
    fontSize: 16,
    marginBottom: 5
  },
  channelName: {
    fontSize: 14,
    color: '#666'
  }
});

export default YouTubeSearchResults;
