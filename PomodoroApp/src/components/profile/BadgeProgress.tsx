import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BadgeIcons from '../badges/BadgeIcons';

interface BadgeProgressProps {
  badge: {
    id: string;
    name: string;
    type: string;
    thresholds: number[];
  };
  level: number;
  progress: number;
  nextLevelThreshold: number;
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({
  badge,
  level,
  progress,
  nextLevelThreshold,
}) => {
  // Rozet seviyesine göre renk ve isim belirle
  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { color: '#CD7F32', name: 'Bronz', nextName: 'Gümüş' };
      case 2:
        return { color: '#C0C0C0', name: 'Gümüş', nextName: 'Altın' };
      case 3:
        return { color: '#FFD700', name: 'Altın', nextName: 'Maks' };
      default:
        return { color: '#999', name: 'Kilit', nextName: 'Bronz' };
    }
  };

  const levelInfo = getLevelInfo(level);

  // İlerleme yüzdesini hesapla
  const getProgressPercentage = () => {
    if (level === 3) return 100; // En yüksek seviye
    if (nextLevelThreshold === 0) return 0;
    
    const percentage = (progress / nextLevelThreshold) * 100;
    return Math.min(Math.max(0, percentage), 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <View style={styles.container}>
      <View style={styles.badgeInfoContainer}>
        <View style={[styles.badgeIconContainer, { borderColor: levelInfo.color }]}>
          <BadgeIcons type={badge.type} level={level} size={30} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeLevel}>
            {level > 0 ? `${levelInfo.name} Seviye` : 'Henüz kazanılmadı'}
          </Text>
        </View>
      </View>
      
      <View style={styles.progressOuterContainer}>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progressPercentage}%`, backgroundColor: levelInfo.color }
            ]} 
          />
        </View>
        
        <View style={styles.progressLabels}>
          <Text style={styles.progressValue}>
            {level === 3 ? 'Maksimum Seviye' : `${progress}/${nextLevelThreshold}`}
          </Text>
          
          {level < 3 && (
            <Text style={styles.nextLevel}>
              Sonraki: {levelInfo.nextName}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f8f8',
  },
  textContainer: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeLevel: {
    fontSize: 14,
    color: '#666',
  },
  progressOuterContainer: {
    marginLeft: 57,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    fontSize: 12,
    color: '#666',
  },
  nextLevel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default BadgeProgress;
