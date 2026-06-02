import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
} from 'react-native-gesture-handler';
import BoothPin from '../components/BoothPin';
import BoothDetailModal from '../components/BoothDetailModal';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// The map container is the full screen area below the header
const MAP_AREA_W = SCREEN_W;
const MAP_AREA_H = SCREEN_H - 110; // account for header + legend

export default function MapScreen({ appData, navigation }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts } = appData;

  const [selectedBooth, setSelectedBooth] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const translateXAnim = useState(new Animated.Value(0))[0];
  const translateYAnim = useState(new Animated.Value(0))[0];

  const handlePinPress = (booth) => {
    setSelectedBooth(booth);
    setDetailVisible(true);
  };

  const handleGoToScan = () => {
    setDetailVisible(false);
    if (navigation && navigation.navigate) {
      navigation.navigate('Scan');
    }
  };

  // Pinch to zoom
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scaleAnim } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = useCallback((event) => {
    if (event.nativeEvent.oldState === 4) { // ACTIVE state ended
      const newScale = Math.max(1, Math.min(scale * event.nativeEvent.scale, 4));
      setScale(newScale);
      scaleAnim.setValue(1);
      
      // Animate to final scale
      Animated.spring(scaleAnim, {
        toValue: newScale,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  }, [scale, scaleAnim]);

  // Pan
  const onPanEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateXAnim,
          translationY: translateYAnim,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onPanStateChange = useCallback((event) => {
    if (event.nativeEvent.oldState === 4) { // ACTIVE state ended
      const newX = translateX + event.nativeEvent.translationX;
      const newY = translateY + event.nativeEvent.translationY;
      
      // Constrain panning
      const maxOffsetX = (MAP_AREA_W * (scale - 1)) / 2;
      const maxOffsetY = (MAP_AREA_H * (scale - 1)) / 2;
      
      setTranslateX(Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)));
      setTranslateY(Math.max(-maxOffsetY, Math.min(maxOffsetY, newY)));
      
      translateXAnim.setValue(0);
      translateYAnim.setValue(0);
    }
  }, [translateX, translateY, scale, translateXAnim, translateYAnim]);

  // Reset zoom
  const handleResetZoom = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.spring(translateXAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.spring(translateYAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  };

  const animatedStyle = {
    transform: [
      { scale: Animated.multiply(scaleAnim, new Animated.Value(scale)) },
      { translateX: Animated.add(translateXAnim, new Animated.Value(translateX)) },
      { translateY: Animated.add(translateYAnim, new Animated.Value(translateY)) },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PBL e-map</Text>
        <Text style={styles.subtitle}>Pinch to zoom • Tap a booth</Text>
      </View>

      <GestureHandlerRootView style={styles.mapWrapper}>
        <PinchGestureHandler
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
        >
          <Animated.View style={styles.pinchContainer}>
            <PanGestureHandler
              onGestureEvent={onPanEvent}
              onHandlerStateChange={onPanStateChange}
              enabled={scale > 1}
            >
              <Animated.View style={[styles.mapContainer, animatedStyle]}>
                <Image
                  source={require('../../assets/map/venue_map.jpg')}
                  style={styles.mapImage}
                  resizeMode="cover"
                />

                {/* Booth Pins - rendered outside transform so they stay same size */}
                {booths.map((booth) => (
                  <View
                    key={booth.booth_id}
                    style={[
                      styles.pinWrapper,
                      {
                        left: `${booth.booth_x}%`,
                        top: `${booth.booth_y}%`,
                      },
                    ]}
                  >
                    <BoothPin
                      booth={booth}
                      hasStamp={hasStamp(booth.booth_id)}
                      onPress={() => handlePinPress(booth)}
                    />
                  </View>
                ))}
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>

        {/* Zoom controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleResetZoom}>
            <Text style={styles.zoomBtnText}>⟲</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>Not Visited</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#27ae60' }]} />
          <Text style={styles.legendText}>Stamped</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#888' }]} />
          <Text style={styles.legendText}>Locked</Text>
        </View>
      </View>

      {/* Modals */}
      <BoothDetailModal
        visible={detailVisible}
        booth={selectedBooth}
        hasStamp={selectedBooth ? hasStamp(selectedBooth.booth_id) : false}
        remainingAttempts={selectedBooth ? getRemainingAttempts(selectedBooth.booth_id) : 0}
        isLockedOut={selectedBooth ? isLockedOut(selectedBooth.booth_id) : false}
        onClose={() => setDetailVisible(false)}
        onScanQR={handleGoToScan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  mapWrapper: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  pinchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width: MAP_AREA_W,
    height: MAP_AREA_H,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  pinWrapper: {
    position: 'absolute',
    // Pins are positioned as percentages of the map container
    // They render at fixed size regardless of zoom
  },
  zoomControls: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    gap: 8,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  zoomBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#aaa',
  },
});
