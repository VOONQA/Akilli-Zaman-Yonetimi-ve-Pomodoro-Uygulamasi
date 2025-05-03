export interface AIRecommendation {
  id: string;
  userId: string;
  timeRange: 'daily' | 'weekly' | 'monthly';
  timeLabel: string; // "2025-04-01" veya "2025-W14" gibi
  insights: {
    insight: string;
    score: number;
    category: 'time' | 'task' | 'focus' | 'break' | 'habit';
    recommendation: string;
  }[];
  mostProductiveHour?: number;
  mostProductiveDay?: string;
  createdAt: Date;
}

// DTO - Veritabanına kaydederken kullanılacak
export interface CreateAIRecommendationDTO {
  userId: string;
  timeRange: 'daily' | 'weekly' | 'monthly';
  timeLabel: string;
  insights: {
    insight: string;
    score: number;
    category: 'time' | 'task' | 'focus' | 'break' | 'habit';
    recommendation: string;
  }[];
  mostProductiveHour?: number;
  mostProductiveDay?: string;
}
