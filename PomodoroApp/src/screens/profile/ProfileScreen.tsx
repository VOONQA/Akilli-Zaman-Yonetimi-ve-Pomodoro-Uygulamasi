import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import ProfileHeader from '../../components/profile/ProfileHeader';
import BadgeCard from '../../components/profile/BadgeCard';
import StatisticsCard from '../../components/profile/StatisticsCard';
import BadgeProgress from '../../components/profile/BadgeProgress';
import { useBadge } from '../../context/BadgeContext';
import { useDatabase } from '../../context/DatabaseContext';
import { useStatistics } from '../../context/StatisticsContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import BadgeDetailScreen from './BadgeDetailScreen';

interface ProfileScreenProps {
  onClose: () => void;
}

interface UserStats {
  totalFocusTime: number;
  totalTasksCompleted: number;
  taskCompletionRate: number;
  mostProductiveDay: string;
}

// Örnek kullanıcı istatistikleri
const MOCK_USER_STATS: UserStats = {
  totalFocusTime: 580, // dakika cinsinden
  totalTasksCompleted: 32,
  taskCompletionRate: 0.78,
  mostProductiveDay: 'Pazartesi'
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose }) => {
  const { 
    badges, 
    userBadges, 
    getAllBadges, 
    getLockedBadges, 
    checkForNewBadges, 
    hasPendingBadges, 
    pendingBadges, 
    clearPendingBadges 
  } = useBadge();
  const { db } = useDatabase();
  const { getMostProductiveTimePeriod } = useStatistics();
  const [userStats, setUserStats] = useState<UserStats>(MOCK_USER_STATS);
  const [lockedBadges, setLockedBadges] = useState<any[]>([]);
  const [showLockedBadges, setShowLockedBadges] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [badgeDetailVisible, setBadgeDetailVisible] = useState(false);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  // Veritabanı verilerini yükle
  useEffect(() => {
    loadUserStats();
    loadBadgeData();
    
    // Kullanıcı rozet bildirimlerini temizle
    if (hasPendingBadges) {
      console.log('Bekleyen rozet bildirimleri temizleniyor');
      clearPendingBadges();
    }
  }, []);

  // Tüm rozet verilerini yükler
  const loadBadgeData = async () => {
    console.log('Rozet verileri yükleniyor...');
    
    // Rozet listelerini yükle
    await loadLockedBadges();
    await loadAllBadges();
    
    // Kullanıcı rozet bildirimlerini temizle
    if (hasPendingBadges) {
      console.log('Bekleyen rozet bildirimleri temizleniyor');
      clearPendingBadges();
    }
  };

  const loadUserStats = async () => {
    if (!db) return;
    
    try {
      // Pomodoro oturumları ve görevlerle ilgili toplam istatistikler - direk veritabanından
      const sessionsResult = await db.select<any>(`
        SELECT 
          COUNT(*) as total_sessions,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_sessions,
          SUM(duration) as total_duration
        FROM pomodoro_sessions 
        WHERE type = 'pomodoro'
      `);
      
      // Görevlerle ilgili toplam istatistikler
      const tasksResult = await db.select<any>(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_tasks
        FROM tasks
      `);
      
      // Pomodoro oturumlarını gün bazında gruplama - en verimli günü bulmak için
      const dailyStatsResult = await db.select<any>(`
        SELECT 
          date,
          COUNT(*) as total_sessions
        FROM pomodoro_sessions 
        WHERE type = 'pomodoro' AND completed = 1
        GROUP BY date
        ORDER BY total_sessions DESC
        LIMIT 1
      `);
      
      // En verimli günü belirle
      let mostProductiveDay = 'Henüz veri yok';
      if (dailyStatsResult && dailyStatsResult.length > 0) {
        try {
          const dateString = dailyStatsResult[0].date;
          // Tarih string'ini Date nesnesine çevir
          const date = new Date(dateString);
          // Gün adını Türkçe olarak formatla
          mostProductiveDay = format(date, 'EEEE', { locale: tr });
        } catch (formatError) {
          console.error('Tarih formatlarken hata:', formatError);
        }
      }
      
      // Veritabanından gelen bilgilerle istatistikleri hesapla
      if (sessionsResult && sessionsResult.length > 0 && tasksResult && tasksResult.length > 0) {
        const sessions = sessionsResult[0];
        const tasks = tasksResult[0];
        
        const totalFocusTime = Math.floor((sessions.total_duration || 0) / 60); // Saniyeden dakikaya çevir
        const totalTasksCompleted = tasks.completed_tasks || 0;
        const totalTasks = tasks.total_tasks || 0;
        
        // Tamamlanma oranını hesapla (en az 0.1 olsun, 0 göstermeyelim)
        const taskCompletionRate = totalTasks > 0 ? 
          Math.max(0.1, totalTasksCompleted / totalTasks) : 
          0.1;
        
        const updatedStats: UserStats = {
          totalFocusTime: totalFocusTime,
          totalTasksCompleted: totalTasksCompleted,
          taskCompletionRate: taskCompletionRate,
          mostProductiveDay: mostProductiveDay
        };
        
        setUserStats(updatedStats);
      }
      // Hiç veri yoksa MOCK_USER_STATS kullan
      else {
        setUserStats(MOCK_USER_STATS);
      }
      
    } catch (error) {
      console.error('Kullanıcı profil verileri yüklenirken hata:', error);
      // Hata olursa mock verileri göster
      setUserStats(MOCK_USER_STATS);
    }
  };

  const loadLockedBadges = async () => {
    try {
      const locked = await getLockedBadges();
      setLockedBadges(locked);
    } catch (error) {
      console.error('Kazanılmamış rozetler yüklenirken hata:', error);
      setLockedBadges([]);
    }
  };

  const loadAllBadges = async () => {
    try {
      const all = await getAllBadges();
      setAllBadges(all);
    } catch (error) {
      console.error('Tüm rozetler yüklenirken hata:', error);
      setAllBadges([]);
    }
  };

  const handleShareProfile = async () => {
    try {
      const earnedBadges = userBadges.length || 0;
      
      await Share.share({
        message: `🏆 Pomodoro Başarılarım:\n⏱️ Toplam Odak Süresi: ${userStats.totalFocusTime} dakika\n✅ Tamamlanan Görevler: ${userStats.totalTasksCompleted}\n🥇 Kazanılan Rozetler: ${earnedBadges}\n\n#PomodoroDiscipline #FocusTime`,
        title: 'Pomodoro Başarılarım'
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const handleShareBadge = async (badgeName: string, levelName: string) => {
    try {
      await Share.share({
        message: `🏆 "${badgeName}" rozetinin ${levelName} seviyesini Pomodoro App'te kazandım! Çalışmalarıma devam ediyorum. #PomodoroDiscipline #FocusTime`,
        title: 'Yeni Rozet Kazandım!'
      });
    } catch (error) {
      console.error('Rozet paylaşım hatası:', error);
    }
  };

  const toggleLockedBadges = () => {
    setShowLockedBadges(!showLockedBadges);
    // Eğer henüz kazanılmamış rozetleri gösteriyorsak, rozet listesini yenile
    if (!showLockedBadges) {
      loadLockedBadges();
    }
  };

  const openBadgeDetail = (badge: any) => {
    setSelectedBadge(badge);
    setBadgeDetailVisible(true);
  };

  const closeBadgeDetail = () => {
    setBadgeDetailVisible(false);
    setSelectedBadge(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <ProfileHeader 
          totalFocusTime={userStats.totalFocusTime}
          completionRate={userStats.taskCompletionRate}
          totalBadges={userBadges.length || 0}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>İstatistikler</Text>
          </View>
          <StatisticsCard 
            totalFocusTime={userStats.totalFocusTime}
            totalTasksCompleted={userStats.totalTasksCompleted}
            taskCompletionRate={userStats.taskCompletionRate}
            mostProductiveDay={userStats.mostProductiveDay}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rozetlerim</Text>
            <View style={styles.badgeActions}>
              <TouchableOpacity onPress={toggleLockedBadges} style={styles.badgeActionButton}>
                <Ionicons name={showLockedBadges ? "ribbon" : "ribbon-outline"} size={16} color="#4a6da7" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareProfile} style={[styles.shareButton, {paddingHorizontal: 12}]}>
                <Ionicons name="share-social-outline" size={16} color="#4a6da7" />
                <Text style={styles.shareButtonText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.badgesContainer}>
            {!showLockedBadges ? (
              userBadges && userBadges.length > 0 ? (
                userBadges.map((userBadge, index) => {
                  const badge = badges.find(b => b.id === userBadge.badgeId);
                  if (!badge) return null;
                  
                  return (
                    <TouchableOpacity
                      key={`badge-${userBadge.badgeId}-${index}`}
                      onPress={() => openBadgeDetail(badge)}
                    >
                      <BadgeCard 
                        badge={{
                          id: badge.id,
                          name: badge.name,
                          description: badge.description,
                          type: badge.type,
                          thresholds: badge.thresholds
                        }}
                        level={userBadge.level}
                        onShare={handleShareBadge}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noBadgesText}>
                  Henüz rozet kazanmadınız. Pomodoro tekniğini kullanarak görevleri tamamladıkça rozetler kazanacaksınız.
                </Text>
              )
            ) : (
              lockedBadges && lockedBadges.length > 0 ? (
                lockedBadges.map((badge, index) => (
                  <TouchableOpacity
                    key={`locked-${badge.id}-${index}`}
                    onPress={() => openBadgeDetail(badge)}
                  >
                    <BadgeCard 
                      badge={{
                        id: badge.id,
                        name: badge.name,
                        description: badge.description,
                        type: badge.type,
                        thresholds: badge.thresholds
                      }}
                      level={0}
                      onShare={handleShareBadge}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noBadgesText}>
                  Tebrikler! Tüm rozetleri kazandınız.
                </Text>
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>İlerleme Durumu</Text>
          </View>
          
          <View style={styles.progressContainer}>
            {badges && badges.length > 0 ? (
              badges.map((badge, index) => {
                const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
                const level = userBadge ? userBadge.level : 0;
                const progress = userBadge ? userBadge.progress : 0;
                const nextLevelThreshold = level < 3 ? badge.thresholds[level] : badge.thresholds[2];
                
                return (
                  <BadgeProgress 
                    key={`progress-${badge.id}-${index}`}
                    badge={badge}
                    level={level}
                    progress={progress}
                    nextLevelThreshold={nextLevelThreshold}
                  />
                );
              })
            ) : (
              <Text style={styles.noBadgesText}>
                İlerleme durumu yüklenemedi.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Rozet Detay Modalı */}
      <Modal
        visible={badgeDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBadgeDetail}
      >
        {selectedBadge && (
          <BadgeDetailScreen
            badge={selectedBadge}
            userBadge={userBadges.find(ub => ub.badgeId === selectedBadge.id)}
            onClose={closeBadgeDetail}
          />
        )}
      </Modal>
    </View>
  );
};

export default ProfileScreen;

