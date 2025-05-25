import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTimer, TimerState } from '../../context/TimerContext';

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  color: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  size,
  strokeWidth,
  color,
  children
}) => {
  const { timerState, totalDuration, timeRemaining } = useTimer();
  const [dashOffset, setDashOffset] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const initialRemainingRef = useRef<number>(0);
  
  // SVG hesaplamaları
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Zamanlayıcıyı başlatma, durdurma ve sıfırlama
  useEffect(() => {
    // Animasyon durdurma fonksiyonu
    const stopAnimation = () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      startTimeRef.current = null;
    };
    
    // Timer durumuna göre işlem yap
    if (timerState === TimerState.READY) {
      // Timer hazır durumunda - ilerlemeyi sıfırla
      stopAnimation();
      setDashOffset(circumference);
    } 
    else if (timerState === TimerState.RUNNING) {
      // Timer çalışıyor - animasyonu başlat
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        initialRemainingRef.current = timeRemaining;
        
        // Animasyon fonksiyonu
        const updateProgress = () => {
          if (!startTimeRef.current) return;
          
          const elapsedSecs = (Date.now() - startTimeRef.current) / 1000;
          const initialProgress = (totalDuration - initialRemainingRef.current) / totalDuration;
          const additionalProgress = elapsedSecs / totalDuration;
          
          // Toplam ilerleme (başlangıç + geçen süre)
          let totalProgress = initialProgress + additionalProgress;
          totalProgress = Math.min(1, Math.max(0, totalProgress));
          
          // StrokeDashoffset hesapla
          const newOffset = circumference * (1 - totalProgress);
          setDashOffset(newOffset);
          
          // Animasyonu sürdür
          animFrameRef.current = requestAnimationFrame(updateProgress);
        };
        
        // Animasyonu başlat
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    } 
    else if (timerState === TimerState.PAUSED) {
      // Timer durduruldu - animasyonu durdur
      stopAnimation();
      // Mevcut ilerlemeyi hesapla ve ayarla
      const progress = (totalDuration - timeRemaining) / totalDuration;
      setDashOffset(circumference * (1 - progress));
    }
    else if (timerState === TimerState.COMPLETED) {
      // Timer tamamlandı - ilerlemeyi 100% yap
      stopAnimation();
      setDashOffset(0);
    }
    
    // Temizleme işlemi
    return () => {
      stopAnimation();
    };
  }, [timerState, timeRemaining, totalDuration, circumference]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Arka plan halkası */}
        <Circle
          stroke="#f0f0f0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        
        {/* İlerleme halkası */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default ProgressRing;
