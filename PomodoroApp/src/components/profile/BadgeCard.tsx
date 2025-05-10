import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BadgeIcons from '../badges/BadgeIcons';

interface BadgeCardProps {
  badge: {
    id: string;
    name: string;
    description: string;
    type: string;
    thresholds: number[];
  };
  level: number;
  onShare: (badgeName: string, levelName: string) => void;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, level, onShare }) => {
  // Rozet seviyesine göre renk ve isim belirle
  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { color: '#CD7F32', name: 'Bronz' };
      case 2:
        return { color: '#C0C0C0', name: 'Gümüş' };
      case 3:
        return { color: '#FFD700', name: 'Altın' };
      default:
        return { color: '#999', name: 'Kilit' };
    }
  };

  const levelInfo = getLevelInfo(level);

  return (
    <View style={styles.container}>
      <View style={[styles.badgeIconContainer, { borderColor: levelInfo.color }]}>
        <BadgeIcons type={badge.type} level={level} size={40} />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.levelTag}>
          <Text style={[styles.levelText, { color: levelInfo.color }]}>{levelInfo.name}</Text>
        </View>
        
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDescription} numberOfLines={2} ellipsizeMode="tail">
          {badge.description}
        </Text>
        
        {level > 0 && (
          <TouchableOpacity 
            style={styles.shareButton} 
            onPress={() => onShare(badge.name, levelInfo.name)}
          >
            <Ionicons name="share-social-outline" size={14} color="#4a6da7" />
            <Text style={styles.shareText}>Paylaş</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    flex: 1,
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#eef2fa',
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  shareText: {
    fontSize: 12,
    color: '#4a6da7',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default BadgeCard;
