// AosView.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, View, ViewProps } from 'react-native';

type AosAnimation = 'fade' | 'zoom-in' | 'fade-left' | 'fade-right' | 'fade-down';

interface Props extends ViewProps {
  animation?: AosAnimation;
  delay?: number;
  duration?: number;
  scrollY: Animated.Value;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRIGGER_THRESHOLD = 0.88; // element triggers when it's within 88% of screen height

export default function AosView({
  animation = 'fade',
  delay = 0,
  duration = 500,
  scrollY,
  children,
  style,
  ...rest
}: Props) {
  const viewRef    = useRef<View>(null);
  const triggered  = useRef(false);

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(
    animation === 'fade-left' ? 40 : animation === 'fade-right' ? -40 : 0
  )).current;
  const translateY = useRef(new Animated.Value(
    animation === 'fade-down' ? -30 : 0
  )).current;
  const scale = useRef(new Animated.Value(
    animation === 'zoom-in' ? 0.85 : 1
  )).current;

  const trigger = () => {
    if (triggered.current) return;
    triggered.current = true;

    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 1, duration, delay, useNativeDriver: true }),
    ]).start();
  };

  const checkVisibility = () => {
    viewRef.current?.measure((_x, _y, _w, _h, _pageX, pageY) => {
      if (pageY < SCREEN_HEIGHT * TRIGGER_THRESHOLD) trigger();
    });
  };

  useEffect(() => {
    // Check once on mount in case the element is already on screen
    checkVisibility();

    const listenerId = scrollY.addListener(() => checkVisibility());
    return () => scrollY.removeListener(listenerId);
  }, []);

  return (
    <Animated.View
      ref={viewRef}
      style={[style, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}