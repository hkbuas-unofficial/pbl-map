import React, { useState, useCallback, useEffect } from 'react';
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

// Map image original dimensions (we'll detect these)
// For now, use the container dimensions
const HEADER_H = 85;  // header height
const LEGEND_H = 45;  // legend height
const MAP_AREA_W = SCREEN_W;
const MAP_AREA_H = SCREEN_H - HEADER_H - LEGEND_H;

export default function MapScreen({ appData, navigation }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts } = appData;

  const [selectedBooth, setSelectedBooth] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  // Calculate initial scale so entire map fits in view
  const getInitialScale = useCallback((imgW, imgH) => {
    const scaleX = MAP_AREA_W / imgW;
    const scaleY = MAP_AREA_H / imgH;
    return Math.min(scaleX, scaleY);
  }, []);

  // Zoom/pan state
  const [baseScale, setBaseScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  
  const scaleAnim = useState(new Animated.Value(1))[0];
  const translateXAnim = useState(new Animated.Value(0))[0];
  const translateYAnim = useState(new Animated.Value(0))[0];

  // Get image dimensions on load
  useEffect(() => {
    const img = Image.resolveAssetSource(require('../../assets/map/venue_map.jpg'));
    const initScale = getInitialScale(img.width, img.height);
    setImageSize({ width: img.width, height: img.height });
    setBaseScale(initScale);
    setScale(initScale);
    scaleAnim.setValue(initScale);
  }, [getInitialScale, scaleAnim]);

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
    if (event.nativeEvent.oldState === 4) {
      const pinchScale = event.nativeEvent.scale;
      const newScale = Math.max(baseScale, Math.min(scale * pinchScale, baseScale * 4));
      setScale(newScale);
      scaleAnim.setValue(newScale);
    }
  }, [scale, baseScale, scaleAnim]);

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
    if (event.nativeEvent.oldState === 4) {
      const newX = translateX + event.nativeEvent.translationX;
      const newY = translateY + event.nativeEvent.translationY;
      
      // Constrain panning based on current zoom
      const scaledW = imageSize.width * scale;
      const scaledH = imageSize.height * scale;
      const maxOffsetX = Math.max(0, (scaledW - MAP_AREA_W) / 2);
      const maxOffsetY = Math.max(0, (scaledH - MAP_AREA_H) / 2);
      
      setTranslateX(Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)));
      setTranslateY(Math.max(-maxOffsetY, Math.min(maxOffsetY, newY)));
      
      translateXAnim.setValue(0);
      translateYAnim.setValue(0);
    }
  }, [translateX, translateY, scale, imageSize, translateXAnim, translateYAnim]);

  // Reset zoom to fit
  const handleResetZoom = () => {
    setScale(baseScale);
    setTranslateX(0);
    setTranslateY(0);
    
    Animated.parallel([
      Animated.spring(scaleAnim, { 
        toValue: baseScale, 
        useNativeDriver: true, 
        friction: 8 
      }),
      Animated.spring(translateXAnim, { 
        toValue: 0, 
        useNativeDriver: true, 
        friction: 8 
      }),
      Animated.spring(translateYAnim, { 
        toValue: 0, 
        useNativeDriver: true, 
        friction: 8 
      }),
    ]).start(() => {
      translateXAnim.setValue(0);
      translateYAnim.setValue(0);
    });
  };

  // Build transform
  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateX: Animated.add(translateXAnim, new Animated.Value(translateX)) },
      { translateY: Animated.add(translateYAnim, new Animated.Value(translateY)) },
    ],
  };

  // Calculate display size of the image at current scale
  const displayWidth = imageSize.width * scale;
  const displayHeight = imageSize.height * scale;

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
              enabled={scale > baseScale}
            >
              <Animated.View style={styles.mapContainer}>
                {/* The zoomable content */}
                <Animated.View
                  style={[
                    styles.zoomableContent,
                    {
                      width: imageSize.width,
                      height: imageSize.height,
                    },
                    animatedStyle,
                  ]}
                >
                  <Image
                    source={require('../../assets/map/venue_map.jpg')}
                    style={{
                      width: imageSize.width,
                      height: imageSize.height,
                    }}
                    resizeMode="stretch"
                  />

                  {/* Booth Pins - positioned absolutely within the zoomable content */}
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
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>

        {/* Zoom reset button */}
        <TouchableOpacity style={styles.zoomBtn} onPress={handleResetZoom}>
          <Text style={styles.zoomBtnText}>⟲</Text>
        </TouchableOpacity>
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

      {/* Booth Detail Modal */}
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
    height: 85,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: {
    fontSize: 22,
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
    position: 'relative',
  },
  pinchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    width: MAP_AREA_W,
    height: MAP_AREA_H,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  zoomableContent: {
    position: 'relative',
  },
  pinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -35 }],
  },
  zoomBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  zoomBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  legend: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
