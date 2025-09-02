import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const CircularProgress = ({ 
  percentage = 0, 
  size = 60, 
  width = 8, 
  tintColor = '#4CAF50', 
  backgroundColor = '#e0e0e0' 
}) => {
  const progressRef = useRef(null);

  useEffect(() => {
    if (progressRef.current) {
      // Iniciar desde 0 y animar hasta el porcentaje final
      progressRef.current.animate(percentage, 1200);
    }
  }, [percentage]);

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        ref={progressRef}
        size={size}
        width={width}
        fill={0} // Iniciar en 0
        tintColor={tintColor}
        backgroundColor={backgroundColor}
        rotation={0}
        lineCap="round"
      >
        {(fill) => (
          <View style={styles.textContainer}>
            <Text style={[styles.percentageText, { fontSize: size * 0.3 }]}>
              {Math.round(fill)}%
            </Text>
          </View>
        )}
      </AnimatedCircularProgress>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
    textAlign: 'center',
  },
});

export default CircularProgress;