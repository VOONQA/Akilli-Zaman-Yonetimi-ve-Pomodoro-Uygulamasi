export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelId?: string;
  categoryId?: string;
  publishedAt?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string | null;
  subscriberCount?: string;
  videoCount?: string;
}

// Türkçe kategori isimleri
export const YouTubeCategories = {
  MUSIC: "Müzik",
  EDUCATION: "Eğitim",
  MOTIVATION: "Motivasyon",
  SAVED: "Kaydedilenler"
} as const;

// YouTube kategori tipi
export type YouTubeCategoryType = typeof YouTubeCategories[keyof typeof YouTubeCategories];
