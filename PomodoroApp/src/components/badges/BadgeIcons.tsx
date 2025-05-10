import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BadgeType } from '../../models/Badge';

interface BadgeIconsProps {
  type: string;
  level: number;
  size: number;
}

const BadgeIcons: React.FC<BadgeIconsProps> = ({ type, level, size }) => {
  // Rozet seviyesine göre renk belirle
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return '#CD7F32'; // Bronz
      case 2:
        return '#C0C0C0'; // Gümüş
      case 3:
        return '#FFD700'; // Altın
      default:
        return '#999999'; // Kilit
    }
  };

  const color = getLevelColor(level);
  
  // Rozet tipine göre ikon seç
  const renderBadgeIcon = () => {
    switch (type) {
      case BadgeType.FOCUS_TIME:
        return <Ionicons name="time" size={size * 0.6} color={color} />;
      
      case BadgeType.TASKS_COMPLETED:
        return <Ionicons name="checkmark-done" size={size * 0.6} color={color} />;
      
      case BadgeType.DAYS_STREAK:
        return <MaterialCommunityIcons name="fire" size={size * 0.6} color={color} />;
      
      case BadgeType.POMODORO_COMPLETED:
        return <MaterialCommunityIcons name="clock-time-four" size={size * 0.6} color={color} />;
      
      case BadgeType.PERFECT_POMODORO:
        return <FontAwesome5 name="bullseye" size={size * 0.5} color={color} />;
      
      default:
        return <Ionicons name="star" size={size * 0.6} color={color} />;
    }
  };

  // Seviye göstergesi
  const renderLevelIndicator = () => {
    if (level === 0) {
      return <Ionicons name="lock-closed" size={size * 0.3} color="#999" style={styles.levelIndicator} />;
    }

    const dots = [];
    for (let i = 0; i < level; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.levelDot,
            { backgroundColor: color, width: size * 0.12, height: size * 0.12 }
          ]}
        />
      );
    }

    return (
      <View style={styles.levelDotsContainer}>
        {dots}
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderBadgeIcon()}
      {renderLevelIndicator()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  levelIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
  levelDotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -4,
    justifyContent: 'center',
  },
  levelDot: {
    borderRadius: 10,
    marginHorizontal: 1,
  },
});

export default BadgeIcons;
