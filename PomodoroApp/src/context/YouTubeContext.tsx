import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { YouTubeVideo, YouTubeCategories } from '../types/youtube';
import { 
  initYouTubeDatabase,
  fetchVideosByCategory, 
  searchVideos,
  saveVideo, 
  removeVideo,
  getSavedVideos,
  getRecommendedVideos
} from '../services/youtubeService';

interface YouTubeContextType {
  isYouTubeModalVisible: boolean;
  setYouTubeModalVisible: (visible: boolean) => void;
  currentVideo: YouTubeVideo | null;
  setCurrentVideo: (video: YouTubeVideo | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  videosByCategory: Record<string, YouTubeVideo[]>;
  savedVideos: YouTubeVideo[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  loadVideos: (category: string) => Promise<void>;
  searchForVideos: (query: string) => Promise<YouTubeVideo[]>;
  saveVideoToList: (video: YouTubeVideo) => Promise<void>;
  removeVideoFromList: (videoId: string) => Promise<void>;
  isVideoSaved: (videoId: string) => boolean;
  loadSavedVideos: () => Promise<void>;
  minimizePlayer: boolean;
  setMinimizePlayer: (minimize: boolean) => void;
  videoProgress: number;
  setVideoProgress: (progress: number) => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const YouTubeContext = createContext<YouTubeContextType | undefined>(undefined);

export const useYouTube = (): YouTubeContextType => {
  const context = useContext(YouTubeContext);
  if (!context) {
    throw new Error('useYouTube must be used within a YouTubeProvider');
  }
  return context;
};

export const YouTubeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isYouTubeModalVisible, setYouTubeModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videosByCategory, setVideosByCategory] = useState<Record<string, YouTubeVideo[]>>({});
  const [savedVideos, setSavedVideos] = useState<YouTubeVideo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(YouTubeCategories.MUSIC);
  const [minimizePlayer, setMinimizePlayer] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Veritabanını ve varsayılan verileri yükle
  useEffect(() => {
    const initializeYouTube = async () => {
      try {
        // Veritabanını başlat
        await initYouTubeDatabase();
        
        // Kaydedilen videoları yükle
        await loadSavedVideos();
        
        // İlk kategori için veri yükle
        await loadVideos(YouTubeCategories.MUSIC);
      } catch (error) {
        console.error('YouTube başlatılırken hata:', error);
      }
    };
    
    initializeYouTube();
  }, []);

  const loadVideos = async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Eğer kategori kaydedilenler ise, kaydedilen videoları yükle
      if (category === YouTubeCategories.SAVED) {
        await loadSavedVideos();
        setLoading(false);
        return;
      }
      
      // Eğer videolar zaten yüklenmişse, tekrar yükleme
      if (videosByCategory[category] && videosByCategory[category].length > 0) {
        setLoading(false);
        return;
      }

      // Önerilen videoları getir
      const videos = await getRecommendedVideos(category);
      
      // Videoları state'e kaydet
      setVideosByCategory(prev => ({
        ...prev,
        [category]: videos
      }));
    } catch (error) {
      console.error(`${category} kategorisi için videolar yüklenirken hata oluştu:`, error);
      setError('Videolar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const searchForVideos = async (query: string): Promise<YouTubeVideo[]> => {
    if (!query.trim()) return [];
    
    try {
      setLoading(true);
      return await searchVideos(query);
    } catch (error) {
      console.error('Video aramasında hata:', error);
      setError('Arama sırasında bir hata oluştu');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadSavedVideos = async () => {
    try {
      const videos = await getSavedVideos();
      setSavedVideos(videos);
      setVideosByCategory(prev => ({
        ...prev,
        [YouTubeCategories.SAVED]: videos
      }));
    } catch (error) {
      console.error('Kaydedilen videoları yüklerken hata:', error);
      setError('Kaydedilen videolar yüklenirken bir hata oluştu');
    }
  };

  const saveVideoToList = async (video: YouTubeVideo) => {
    try {
      const updatedSavedVideos = await saveVideo(video);
      setSavedVideos(updatedSavedVideos);
      setVideosByCategory(prev => ({
        ...prev,
        [YouTubeCategories.SAVED]: updatedSavedVideos
      }));
    } catch (error) {
      console.error('Video kaydederken hata:', error);
      setError('Video kaydedilirken bir hata oluştu');
    }
  };

  const removeVideoFromList = async (videoId: string) => {
    try {
      const updatedSavedVideos = await removeVideo(videoId);
      setSavedVideos(updatedSavedVideos);
      setVideosByCategory(prev => ({
        ...prev,
        [YouTubeCategories.SAVED]: updatedSavedVideos
      }));
    } catch (error) {
      console.error('Video kaldırırken hata:', error);
      setError('Video kaldırılırken bir hata oluştu');
    }
  };

  const isVideoSaved = (videoId: string): boolean => {
    return savedVideos.some(video => video.id === videoId);
  };

  const contextValue = {
    isYouTubeModalVisible,
    setYouTubeModalVisible,
    currentVideo,
    setCurrentVideo,
    isPlaying,
    setIsPlaying,
    videosByCategory,
    savedVideos,
    selectedCategory,
    setSelectedCategory,
    loadVideos,
    searchForVideos,
    saveVideoToList,
    removeVideoFromList,
    isVideoSaved,
    loadSavedVideos,
    minimizePlayer,
    setMinimizePlayer,
    videoProgress,
    setVideoProgress,
    error,
    setError,
    loading,
    setLoading
  };

  return (
    <YouTubeContext.Provider value={contextValue}>
      {children}
    </YouTubeContext.Provider>
  );
};
