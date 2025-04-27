import { YouTubeVideo, YouTubeCategories, YouTubeChannel } from '../types/youtube';
import { openDatabase } from './database';

const SAVED_VIDEOS_TABLE = 'saved_youtube_videos';
const YOUTUBE_API_KEY = 'AIzaSyAqvxokYTe_mjAhWO5l2pYb4jaqDVNRjfE';

// Veritabanı tablosunu oluştur
export const initYouTubeDatabase = async (): Promise<void> => {
  try {
    const db = openDatabase();
    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${SAVED_VIDEOS_TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        thumbnail TEXT NOT NULL,
        channelTitle TEXT NOT NULL,
        channelId TEXT,
        categoryId TEXT
      )`
    );
    console.log('YouTube veritabanı başarıyla oluşturuldu');
  } catch (error) {
    console.error('YouTube veritabanı oluşturulurken hata:', error);
  }
};

// YouTube videolarını kategoriye göre getir
export const fetchVideosByCategory = async (categoryId: string, maxResults = 10): Promise<YouTubeVideo[]> => {
  try {
    // Önce popüler videoları getirelim
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=TR&relevanceLanguage=tr&videoCategoryId=${categoryId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (!data.items) {
      console.error('API yanıtında items bulunamadı:', data);
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId
    }));
  } catch (error) {
    console.error('YouTube videolarını alırken hata oluştu:', error);
    return getDefaultVideos(categoryId);
  }
};

// YouTube'da video araması yap
export const searchVideos = async (query: string): Promise<YouTubeVideo[]> => {
  try {
    // URL parametresini güvenli hale getir
    const encodedQuery = encodeURIComponent(query);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&regionCode=TR&relevanceLanguage=tr&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (!data.items) {
      console.error('API yanıtında items bulunamadı:', data);
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId
    }));
  } catch (error) {
    console.error('YouTube aramasında hata oluştu:', error);
    return [];
  }
};

// YouTube'da kanal araması yap
export const searchChannels = async (query: string): Promise<YouTubeChannel[]> => {
  try {
    // URL parametresini güvenli hale getir
    const encodedQuery = encodeURIComponent(query);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&regionCode=TR&relevanceLanguage=tr&type=channel&maxResults=10&key=${YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (!data.items) {
      console.error('API yanıtında items bulunamadı:', data);
      return [];
    }
    
    return data.items.map((item: any) => ({
      id: item.id.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    }));
  } catch (error) {
    console.error('YouTube kanal aramasında hata oluştu:', error);
    return [];
  }
};

// Aynı anda hem video hem kanal araması yapar
export const searchYouTube = async (query: string): Promise<{videos: YouTubeVideo[], channels: YouTubeChannel[]}> => {
  try {
    // URL parametresini güvenli hale getir
    const encodedQuery = encodeURIComponent(query);
    
    // Video araması yap
    const videoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&regionCode=TR&relevanceLanguage=tr&type=video&maxResults=15&key=${YOUTUBE_API_KEY}`;
    
    // Kanal araması yap
    const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&regionCode=TR&relevanceLanguage=tr&type=channel&maxResults=5&key=${YOUTUBE_API_KEY}`;
    
    console.log('YouTube API araması yapılıyor:', query);
    
    try {
      // Video ve kanal aramalarını paralel olarak yap
      const [videoResponse, channelResponse] = await Promise.all([
        fetch(videoUrl),
        fetch(channelUrl),
      ]);
      
      const videoData = await videoResponse.json();
      const channelData = await channelResponse.json();
      
      console.log('Video sonuç:', videoData);
      console.log('Kanal sonuç:', channelData);
      
      // API'dan dönen videolar
      const videos = videoData.items ? videoData.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId
      })) : [];
      
      // API'dan dönen kanallar
      const channels = channelData.items ? channelData.items.map((item: any) => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      })) : [];
      
      console.log('İşlenmiş video sonuçları:', videos.length);
      console.log('İşlenmiş kanal sonuçları:', channels.length);
      
      return { videos, channels };
    } catch (apiError) {
      console.error('YouTube API çağrısında hata:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('YouTube aramasında hata oluştu:', error);
    // API kota sınırı aşıldığında veya başka bir hata oluştuğunda varsayılan içerik döndür
    console.log('Hata sonrası varsayılan verileri döndürüyorum');
    
    // Arama sorgusuyla ilgili varsayılan videoları hazırlayalım
    const defaultVideos = getRelatedDefaultVideos(query);
    const defaultChannels = getRelatedDefaultChannels(query);
    
    return {
      videos: defaultVideos.length > 0 ? defaultVideos : getDefaultVideos(YouTubeCategories.EDUCATION),
      channels: defaultChannels.length > 0 ? defaultChannels : getDefaultChannels()
    };
  }
};

// Arama terimiyle ilgili varsayılan videoları getir
const getRelatedDefaultVideos = (query: string): YouTubeVideo[] => {
  // Arama terimini küçük harfe çevirip kontrol et
  const searchTerm = query.toLowerCase();
  
  // Farklı arama terimleri için varsayılan içerikler
  const predefinedResults: {[key: string]: YouTubeVideo[]} = {
    'ders': [
      {
        id: "X7dRvVyb6WI",
        title: "3 Saatlik Ders Çalışma Müziği 📚 Konsantrasyon Müziği",
        thumbnail: "https://i.ytimg.com/vi/X7dRvVyb6WI/mqdefault.jpg",
        channelTitle: "Ders Çalışma Müzikleri",
        channelId: "UC-TuwMcFXSZZjZiv-3OBKTA"
      },
      {
        id: "_PV_SBFJS74",
        title: "Ders Çalışma Taktikleri | Verimli Ders Çalışma",
        thumbnail: "https://i.ytimg.com/vi/_PV_SBFJS74/mqdefault.jpg",
        channelTitle: "Eğitim Koçu",
        channelId: "UCv6jcPwFujuTIwFQ11jt1Yw"
      }
    ],
    'müzik': [
      {
        id: "X8ZawEdJg6o",
        title: "Odaklanma ve Konsantrasyon Müziği 🎵 En İyi Çalışma Müzikleri",
        thumbnail: "https://i.ytimg.com/vi/X8ZawEdJg6o/mqdefault.jpg",
        channelTitle: "Relaxing Music",
        channelId: "UCj-6YZj3aVL8N4fRk5BvNUQ"
      },
      {
        id: "_RI_xYovTyI",
        title: "Ders Çalışırken Dinlenecek Müzikler 2024 🎵 En İyi Çalışma Müzikleri",
        thumbnail: "https://i.ytimg.com/vi/_RI_xYovTyI/mqdefault.jpg",
        channelTitle: "Study Music",
        channelId: "UCXzK6YmZLsLPpRE5jJY9C9g"
      }
    ],
    'motivasyon': [
      {
        id: "auXXdzlKbOY",
        title: "Motivasyon Videosu | Başarıya Giden Yol",
        thumbnail: "https://i.ytimg.com/vi/auXXdzlKbOY/mqdefault.jpg",
        channelTitle: "Motivasyon TV",
        channelId: "UCzdqVQ-4DyYSel-EnMYssyQ"
      },
      {
        id: "HznY0aaJYEI",
        title: "BAŞARI İÇİN MOTİVASYON | Türkçe Motivasyon Videosu",
        thumbnail: "https://i.ytimg.com/vi/HznY0aaJYEI/mqdefault.jpg",
        channelTitle: "Motivasyon Plus",
        channelId: "UC3NbM9K6CgWG_NZbk-thjKQ"
      }
    ]
  };
  
  // Arama terimini kontrol et, eşleşen içerik varsa döndür
  for (const key in predefinedResults) {
    if (searchTerm.includes(key)) {
      return predefinedResults[key];
    }
  }
  
  // Eşleşen bir anahtar kelime yoksa boş dizi döndür
  return [];
};

// Arama terimiyle ilgili varsayılan kanalları getir
const getRelatedDefaultChannels = (query: string): YouTubeChannel[] => {
  // Arama terimini küçük harfe çevirip kontrol et
  const searchTerm = query.toLowerCase();
  
  // Farklı arama terimleri için varsayılan kanallar
  const predefinedChannels: {[key: string]: YouTubeChannel[]} = {
    'ders': [
      {
        id: "UCv6jcPwFujuTIwFQ11jt1Yw",
        title: "Eğitim Koçu",
        description: "Eğitim, ders çalışma teknikleri ve verimlilik üzerine içerikler.",
        thumbnail: "https://i.ytimg.com/vi/_PV_SBFJS74/mqdefault.jpg",
      },
      {
        id: "UC-TuwMcFXSZZjZiv-3OBKTA",
        title: "Ders Çalışma Müzikleri",
        description: "Ders çalışırken dinlenebilecek müzikler ve konsantrasyon videoları.",
        thumbnail: "https://i.ytimg.com/vi/X7dRvVyb6WI/mqdefault.jpg",
      }
    ],
    'müzik': [
      {
        id: "UCj-6YZj3aVL8N4fRk5BvNUQ",
        title: "Relaxing Music",
        description: "Ders çalışırken dinlenebilecek odaklanma ve konsantrasyon müzikleri.",
        thumbnail: "https://i.ytimg.com/vi/X8ZawEdJg6o/mqdefault.jpg",
      },
      {
        id: "UCXzK6YmZLsLPpRE5jJY9C9g",
        title: "Study Music",
        description: "En iyi çalışma müzikleri ve konsantrasyon videoları.",
        thumbnail: "https://i.ytimg.com/vi/_RI_xYovTyI/mqdefault.jpg",
      }
    ],
    'motivasyon': [
      {
        id: "UCzdqVQ-4DyYSel-EnMYssyQ",
        title: "Motivasyon TV",
        description: "Motivasyon, başarı ve kişisel gelişim videoları.",
        thumbnail: "https://i.ytimg.com/vi/auXXdzlKbOY/mqdefault.jpg",
      },
      {
        id: "UC3NbM9K6CgWG_NZbk-thjKQ",
        title: "Motivasyon Plus",
        description: "Kişisel gelişim ve motivasyon içerikleri.",
        thumbnail: "https://i.ytimg.com/vi/HznY0aaJYEI/mqdefault.jpg",
      }
    ]
  };
  
  // Arama terimini kontrol et, eşleşen içerik varsa döndür
  for (const key in predefinedChannels) {
    if (searchTerm.includes(key)) {
      return predefinedChannels[key];
    }
  }
  
  // Eşleşen bir anahtar kelime yoksa boş dizi döndür
  return [];
};

// Kanal detaylarını getir
export const getChannelDetails = async (channelId: string): Promise<YouTubeChannel | null> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('Kanal bulunamadı:', data);
      return null;
    }
    
    const channel = data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
      banner: channel.brandingSettings?.image?.bannerExternalUrl || null,
      subscriberCount: channel.statistics?.subscriberCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
    };
  } catch (error) {
    console.error('Kanal detayları alınırken hata oluştu:', error);
    return null;
  }
};

// Kanal videolarını getir
export const getChannelVideos = async (channelId: string, pageToken?: string): Promise<{videos: YouTubeVideo[], nextPageToken?: string}> => {
  try {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=15&type=video&key=${YOUTUBE_API_KEY}`;
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.items) {
      console.error('API yanıtında items bulunamadı:', data);
      return { videos: [] };
    }

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
        title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      }));
    
    return {
      videos,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error('Kanal videoları alınırken hata oluştu:', error);
    return { videos: [] };
  }
};

// Kategoriye göre önerilen videoları al
export const getRecommendedVideos = async (category: string): Promise<YouTubeVideo[]> => {
  try {
    // Önceden tanımlanmış hazır videoları getir
    const predefinedVideos = getDefaultVideos(category);
    
    if (predefinedVideos.length > 0) {
      return predefinedVideos;
    }
    
    // Türkçe anahtar kelimeler
    const turkishKeywords = {
      [YouTubeCategories.MUSIC]: "çalışma müzik odaklanma",
      [YouTubeCategories.EDUCATION]: "ders çalışma teknikleri",
      [YouTubeCategories.MOTIVATION]: "motivasyon konuşma"
    };
    
    // Kategori için Türkçe anahtar kelimelerle arama yap
    const searchKey = Object.entries(YouTubeCategories).find(([_, val]) => val === category);
    const keyword = searchKey ? turkishKeywords[searchKey[0] as keyof typeof turkishKeywords] : `${category} türkçe`;
    
    return await searchVideos(keyword);
  } catch (error) {
    console.error('Öneriler alınırken hata:', error);
    return [];
  }
};

// Kaydedilen video işlemleri
export const saveVideo = async (video: YouTubeVideo): Promise<YouTubeVideo[]> => {
  try {
    const db = openDatabase();
    
    // Önce kontrol et
    const existingVideos = await db.select<YouTubeVideo>(
      `SELECT * FROM ${SAVED_VIDEOS_TABLE} WHERE id = ?`,
      [video.id]
    );
    
    if (existingVideos.length === 0) {
      // Video daha önce kaydedilmemiş, kaydet
      await db.insert(SAVED_VIDEOS_TABLE, {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        channelId: video.channelId || '',
        categoryId: video.categoryId || ''
      });
    }
    
    // Tüm kaydedilen videoları getir
    return await getSavedVideos();
  } catch (error) {
    console.error('Video kaydedilirken hata:', error);
    return [];
  }
};

// Video kaldır
export const removeVideo = async (videoId: string): Promise<YouTubeVideo[]> => {
  try {
    const db = openDatabase();
    
    // Videoyu sil
    await db.delete(SAVED_VIDEOS_TABLE, 'id = ?', [videoId]);
    
    // Güncel kayıtlı videoları getir
    return await getSavedVideos();
  } catch (error) {
    console.error('Video kaldırılırken hata:', error);
    return [];
  }
};

// Kaydedilen videoları getir
export const getSavedVideos = async (): Promise<YouTubeVideo[]> => {
  try {
    const db = openDatabase();
    
    // Tüm kayıtlı videoları getir
    return await db.select<YouTubeVideo>(
      `SELECT * FROM ${SAVED_VIDEOS_TABLE}`
    );
  } catch (error) {
    console.error('Kaydedilen videoları alırken hata:', error);
    return [];
  }
};

// Varsayılan videolar
const getDefaultVideos = (category: string): YouTubeVideo[] => {
  // Her kategori için hazır video koleksiyonları
  const predefinedVideos: Record<string, YouTubeVideo[]> = {
    [YouTubeCategories.MUSIC]: [
      {
        id: "X7dRvVyb6WI",
        title: "3 Saatlik Ders Çalışma Müziği 📚 Konsantrasyon Müziği 🎵 Beyin Gücünü Artıran Müzik",
        thumbnail: "https://i.ytimg.com/vi/X7dRvVyb6WI/mqdefault.jpg",
        channelTitle: "Relaxing Music",
        channelId: "UC-TuwMcFXSZZjZiv-3OBKTA"
      },
      {
        id: "_RI_xYovTyI",
        title: "Ders Çalışırken Dinlenecek Müzikler 2024 🎵 Konsantrasyon Müziği",
        thumbnail: "https://i.ytimg.com/vi/_RI_xYovTyI/mqdefault.jpg",
        channelTitle: "Study Music",
        channelId: "UCXzK6YmZLsLPpRE5jJY9C9g"
      },
      {
        id: "X8ZawEdJg6o",
        title: "Odaklanma ve Konsantrasyon Müziği 🎵 Ders Çalışırken Dinlenecek Müzik",
        thumbnail: "https://i.ytimg.com/vi/X8ZawEdJg6o/mqdefault.jpg",
        channelTitle: "Focus Music",
        channelId: "UCj-6YZj3aVL8N4fRk5BvNUQ"
      },
      {
        id: "sLylya2TxcM",
        title: "Ders Çalışma Müziği 📚 Konsantrasyon Müziği 🎵 Beyin Gücünü Artıran Müzik",
        thumbnail: "https://i.ytimg.com/vi/sLylya2TxcM/mqdefault.jpg",
        channelTitle: "Study Music",
        channelId: "UCWX4VddlNKoYBU_Z3q4CqBQ"
      },
      {
        id: "Nv2yM28aAFY",
        title: "Ders Çalışma ve Odaklanma Müziği | Zihin Açan ve Konsantrasyon Artıran Müzik",
        thumbnail: "https://i.ytimg.com/vi/Nv2yM28aAFY/mqdefault.jpg",
        channelTitle: "Müzik Kutusu",
        channelId: "UCSFGb1yIQrtQRU5VZ_lfx2A"
      },
      {
        id: "QIkPbhAkvwA",
        title: "Ders Çalışırken Dinlenecek Müzik - Konsantrasyon Müziği 2024",
        thumbnail: "https://i.ytimg.com/vi/QIkPbhAkvwA/mqdefault.jpg",
        channelTitle: "Study Music",
        channelId: "UCmYFyvzCzEj11Gjrg8m4uJg"
      },
      {
        id: "m7BZoJt6nqw",
        title: "Ders Çalışırken Dinlenecek Müzikler | Konsantrasyon Müziği",
        thumbnail: "https://i.ytimg.com/vi/m7BZoJt6nqw/mqdefault.jpg",
        channelTitle: "Focus Music",
        channelId: "UCya-IE1Iy15N-IlQXYZF4jA"
      },
      {
        id: "4cLD3v8glFg",
        title: "Ders Çalışırken Dinlenecek Müzik 2024 | Konsantrasyon Müziği",
        thumbnail: "https://i.ytimg.com/vi/4cLD3v8glFg/mqdefault.jpg",
        channelTitle: "Study Music",
        channelId: "UCsg5ZFKz7XxbPDjbH6FyWIA"
      }
    ],
    [YouTubeCategories.EDUCATION]: [
      {
        id: "_PV_SBFJS74",
        title: "Ders Çalışma Taktikleri | Verimli Ders Çalışma Teknikleri",
        thumbnail: "https://i.ytimg.com/vi/_PV_SBFJS74/mqdefault.jpg",
        channelTitle: "Eğitim Koçu",
        channelId: "UCv6jcPwFujuTIwFQ11jt1Yw"
      },
      {
        id: "1DFiX3Jc18w",
        title: "En Etkili Ders Çalışma Teknikleri | Nasıl Daha İyi Öğrenirim?",
        thumbnail: "https://i.ytimg.com/vi/1DFiX3Jc18w/mqdefault.jpg",
        channelTitle: "Başarı Yolu",
        channelId: "UC-TuwMcFXSZZjZiv-3OBKTA"
      },
      {
        id: "fpxGdBa4fSg",
        title: "Ders Çalışma Taktikleri ve Motivasyon",
        thumbnail: "https://i.ytimg.com/vi/fpxGdBa4fSg/mqdefault.jpg",
        channelTitle: "Eğitim Platformu",
        channelId: "UCJuFGJ97IAJYzKU0K7bzr-g"
      },
      {
        id: "S1xDVOw-v_E",
        title: "Matematik Dersine Nasıl Çalışılır? | Etkili Yöntemler",
        thumbnail: "https://i.ytimg.com/vi/S1xDVOw-v_E/mqdefault.jpg",
        channelTitle: "Matematik Hocası",
        channelId: "UCXzK6YmZLsLPpRE5jJY9C9g"
      },
      {
        id: "-4no7xZO2Kg",
        title: "Çalışma Programı Nasıl Hazırlanır? | Adım Adım Rehber",
        thumbnail: "https://i.ytimg.com/vi/-4no7xZO2Kg/mqdefault.jpg",
        channelTitle: "Eğitim Koçu",
        channelId: "UCcvmxY1oY9OOxkxPopx5NUg"
      },
      {
        id: "9xsCyM_KWkg",
        title: "Verimli Çalışma Programı Hazırlama | Detaylı Anlatım",
        thumbnail: "https://i.ytimg.com/vi/9xsCyM_KWkg/mqdefault.jpg",
        channelTitle: "Başarı Yolu",
        channelId: "UCnMxUoJfTy6GlsKS7KBQxrA"
      },
      {
        id: "z7Surw-7jtM",
        title: "Çalışma Programı ve Planlama | Başarıya Giden Yol",
        thumbnail: "https://i.ytimg.com/vi/z7Surw-7jtM/mqdefault.jpg",
        channelTitle: "Eğitim Platformu",
        channelId: "UCK1wt5s0Y43uPshBd4rAFGQ"
      },
      {
        id: "N3FS9mRLFG4",
        title: "Etkili Çalışma Programı ve Zaman Yönetimi",
        thumbnail: "https://i.ytimg.com/vi/N3FS9mRLFG4/mqdefault.jpg",
        channelTitle: "Başarı Koçu",
        channelId: "UCSLdGqi7uyKgLq9UxuaZJtw"
      }
    ],
    [YouTubeCategories.MOTIVATION]: [
      {
        id: "auXXdzlKbOY",
        title: "Motivasyon Videosu | Başarıya Giden Yol",
        thumbnail: "https://i.ytimg.com/vi/auXXdzlKbOY/mqdefault.jpg",
        channelTitle: "Motivasyon TV",
        channelId: "UCzdqVQ-4DyYSel-EnMYssyQ"
      },
      {
        id: "HznY0aaJYEI",
        title: "BAŞARI İÇİN MOTİVASYON | Türkçe Motivasyon Videosu",
        thumbnail: "https://i.ytimg.com/vi/HznY0aaJYEI/mqdefault.jpg",
        channelTitle: "Motivasyon Plus",
        channelId: "UC3NbM9K6CgWG_NZbk-thjKQ"
      },
      {
        id: "15WYQgO2_Q0",
        title: "Hayallerine Ulaşmak İçin İzle | Motivasyon",
        thumbnail: "https://i.ytimg.com/vi/15WYQgO2_Q0/mqdefault.jpg",
        channelTitle: "Başarı Yolu",
        channelId: "UCkXVnSuGW9vCSx2zePDZ4WA"
      },
      {
        id: "L29KeKGWS18",
        title: "Vazgeçme! | Türkçe Motivasyon",
        thumbnail: "https://i.ytimg.com/vi/L29KeKGWS18/mqdefault.jpg",
        channelTitle: "Motivasyon Kanalı",
        channelId: "UCwfvmUMT9k6zU8UeZxL1qCg"
      },
      {
        id: "-7hUtbhutco",
        title: "BAŞARI İÇİN İZLE | Motivasyon Videosu",
        thumbnail: "https://i.ytimg.com/vi/-7hUtbhutco/mqdefault.jpg",
        channelTitle: "Başarı TV",
        channelId: "UC9rvVzcfQDZp5Z9t6DN3uJA"
      },
      {
        id: "jfCk_9sdXds",
        title: "Hedeflerine Ulaşmak İçin İzle | Motivasyon",
        thumbnail: "https://i.ytimg.com/vi/jfCk_9sdXds/mqdefault.jpg",
        channelTitle: "Kişisel Gelişim",
        channelId: "UCJUmMYKlRgPdLVDmBuPqv-g"
      },
      {
        id: "-2uu72kg-9w",
        title: "ASLA VAZGEÇME! | Türkçe Motivasyon Videosu",
        thumbnail: "https://i.ytimg.com/vi/-2uu72kg-9w/mqdefault.jpg",
        channelTitle: "Motivasyon Plus",
        channelId: "UC7yqzJcQ7X4Q2NreBB_qKTg"
      }
    ]
  };
  
  return predefinedVideos[category] || [];
};

// Varsayılan kanallar
const getDefaultChannels = (): YouTubeChannel[] => {
  return [
    {
      id: "UCv6jcPwFujuTIwFQ11jt1Yw",
      title: "Eğitim Koçu",
      description: "Eğitim, ders çalışma teknikleri ve verimlilik üzerine içerikler.",
      thumbnail: "https://i.ytimg.com/vi/_PV_SBFJS74/mqdefault.jpg",
    },
    {
      id: "UC-TuwMcFXSZZjZiv-3OBKTA",
      title: "Relaxing Music",
      description: "Ders çalışırken dinlenebilecek odaklanma ve konsantrasyon müzikleri.",
      thumbnail: "https://i.ytimg.com/vi/X7dRvVyb6WI/mqdefault.jpg",
    },
    {
      id: "UCzdqVQ-4DyYSel-EnMYssyQ",
      title: "Motivasyon TV",
      description: "Motivasyon, başarı ve kişisel gelişim videoları.",
      thumbnail: "https://i.ytimg.com/vi/auXXdzlKbOY/mqdefault.jpg",
    }
  ];
};
