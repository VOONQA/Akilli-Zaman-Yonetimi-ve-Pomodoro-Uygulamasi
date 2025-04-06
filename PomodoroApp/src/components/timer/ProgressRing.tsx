import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressRingProps {
  progress: number; // 0-100 arası
  size: number;
  strokeWidth: number;
  color: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  children
}) => {
  // SVG halka için hesaplamalar
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Animasyon değeri
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  // Animated çemberi oluştur
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  // Progress interpolasyonu
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp'
  });

  // Progress değiştiğinde animasyon
  useEffect(() => {
    // Daha pürüzsüz animasyon için timing kullan
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [progress, animatedValue]);

  return (
    <View style={[
      styles.container, 
      { width: size, height: size },
      styles.shadowContainer
    ]}>
      <Svg width={size} height={size}>
        {/* Arkaplan halkası */}
        <Circle
          stroke="#f0f0f0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        
        {/* Animasyonlu ilerleme halkası */}
        <AnimatedCircle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      
      {/* İçerik (zamanlayıcı) */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'transparent',
  }
});

export default ProgressRing;
