import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BadgeIcons from '../../components/badges/BadgeIcons';
import { Badge, BadgeLevel, UserBadge, BadgeType } from '../../models/Badge';
import { getBadgeLevelInfo } from '../../utils/badgeUtils';

interface BadgeDetailScreenProps {
  badge: Badge;
  userBadge?: UserBadge;
  onClose: () => void;
}

const BadgeDetailScreen: React.FC<BadgeDetailScreenProps> = ({ badge, userBadge, onClose }) => {
  const level = userBadge?.level || 0;
  const currentLevelInfo = getBadgeLevelInfo(level as BadgeLevel);
  
  const getBadgeRequirementText = (type: string, threshold: number) => {
    switch (type) {
      case BadgeType.FOCUS_TIME:
        return `${threshold} dakika odaklan`;
      case BadgeType.TASKS_COMPLETED:
        return `${threshold} görev tamamla`;
      case BadgeType.DAYS_STREAK:
        return `${threshold} gün ard arda kullan`;
      case BadgeType.POMODORO_COMPLETED:
        return `${threshold} pomodoro tamamla`;
      case BadgeType.PERFECT_POMODORO:
        return `${threshold} kesintisiz pomodoro tamamla`;
      default:
        return `Eşik değeri: ${threshold}`;
    }
  };
  
  const renderLevelRequirements = () => {
    return badge.thresholds.map((threshold, index) => {
      const levelName = ['Bronz', 'Gümüş', 'Altın'][index];
      const isEarned = userBadge && userBadge.level > index;
      const isCurrent = userBadge && userBadge.level === index + 1;
      
      return (
        <View 
          key={index} 
          style={[
            styles.levelRequirement,
            isEarned ? styles.earnedLevel : {},
            isCurrent ? styles.currentLevel : {}
          ]}
        >
          <Text style={[
            styles.levelName,
            isEarned ? styles.earnedLevelText : {},
            isCurrent ? styles.currentLevelText : {}
          ]}>
            {levelName}
          </Text>
          <Text style={styles.requirementText}>
            {getBadgeRequirementText(badge.type, threshold)}
          </Text>
          {isEarned && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.badgeHeader}>
          <View style={[styles.badgeIconContainer, { borderColor: currentLevelInfo.color }]}>
            <BadgeIcons type={badge.type} level={level} size={80} />
          </View>
          
          <Text style={styles.badgeName}>{badge.name}</Text>
          
          {level > 0 && (
            <View style={[styles.levelBadge, { backgroundColor: currentLevelInfo.color + '30', borderColor: currentLevelInfo.color }]}>
              <Text style={[styles.levelBadgeText, { color: currentLevelInfo.color }]}>
                {currentLevelInfo.name} Seviye
              </Text>
            </View>
          )}
          
          <Text style={styles.badgeDescription}>{badge.description}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.levelRequirementsContainer}>
          <Text style={styles.sectionTitle}>Rozet Seviyeleri</Text>
          {renderLevelRequirements()}
        </View>
        
        {userBadge && userBadge.level > 0 && (
          <>
            <View style={styles.divider} />
            
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Rozet Bilgileri</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Kazanılma Tarihi:</Text>
                <Text style={styles.statValue}>
                  {new Date(userBadge.earnedAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Mevcut İlerleme:</Text>
                <Text style={styles.statValue}>{userBadge.progress}</Text>
              </View>
              
              {level < 3 && (
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Sonraki Seviye:</Text>
                  <Text style={styles.statValue}>
                    {userBadge.progress} / {badge.thresholds[level]}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
        
        {!userBadge && (
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed" size={24} color="#999" />
            <Text style={styles.lockText}>
              Bu rozeti kazanmak için pomodoro tekniğini kullanmaya devam edin.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  badgeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
  },
  badgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  levelRequirementsContainer: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  levelRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    position: 'relative',
  },
  earnedLevel: {
    backgroundColor: '#e8f5e9',
  },
  currentLevel: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  levelName: {
    fontWeight: 'bold',
    color: '#555',
    width: 60,
  },
  earnedLevelText: {
    color: '#2E7D32',
  },
  currentLevelText: {
    color: '#1565C0',
  },
  requirementText: {
    flex: 1,
    color: '#555',
  },
  checkmark: {
    position: 'absolute',
    right: 12,
  },
  statsContainer: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  lockContainer: {
    alignItems: 'center',
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
  },
  lockText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default BadgeDetailScreen;
