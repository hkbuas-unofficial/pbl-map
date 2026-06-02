import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
} from 'react-native-gesture-handler';
import BoothPin from '../components/BoothPin';
import BoothDetailModal from '../components/BoothDetailModal';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const HEADER_H = 85;
const LEGEND_H = 45;
const MAP_AREA_W = SCREEN_W;
const MAP_AREA_H = SCREEN_H - HEADER_H - LEGEND_H;

// Mouse wheel zoom sensitivity
const WHEEL_SENSITIVITY = 0.001;

export default function MapScreen({ appData, navigation }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts, getStampCount } = appData;

  const [selectedBooth, setSelectedBooth] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  const mapContainerRef = useRef(null);
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0 });

  // Zoom/pan state
  const [baseScale, setBaseScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Calculate initial scale so entire map fits in view
  const getInitialScale = useCallback((imgW, imgH) => {
    const scaleX = MAP_AREA_W / imgW;
    const scaleY = MAP_AREA_H / imgH;
    return Math.min(scaleX, scaleY);
  }, []);

  // Get image dimensions on load
  useEffect(() => {
    const img = Image.resolveAssetSource(require('../../assets/map/venue_map.jpg'));
    const initScale = getInitialScale(img.width, img.height);
    setImageSize({ width: img.width, height: img.height });
    setBaseScale(initScale);
    setScale(initScale);
    scaleAnim.setValue(initScale);
  }, [getInitialScale, scaleAnim]);

  // Measure container position for mouse events
  const onContainerLayout = useCallback(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.measure((x, y, width, height, pageX, pageY) => {
        setContainerLayout({ x: pageX, y: pageY });
      });
    }
  }, []);

  // Apply constrained transform
  const applyTransform = useCallback((newScale, newTranslateX, newTranslateY) => {
    const scaledW = imageSize.width * newScale;
    const scaledH = imageSize.height * newScale;
    const maxOffsetX = Math.max(0, (scaledW - MAP_AREA_W) / 2);
    const maxOffsetY = Math.max(0, (scaledH - MAP_AREA_H) / 2);

    const constrainedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newTranslateX));
    const constrainedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newTranslateY));

    setScale(newScale);
    setTranslateX(constrainedX);
    setTranslateY(constrainedY);
    scaleAnim.setValue(newScale);
    translateXAnim.setValue(constrainedX);
    translateYAnim.setValue(constrainedY);

    return { x: constrainedX, y: constrainedY };
  }, [imageSize, scaleAnim, translateXAnim, translateYAnim]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * WHEEL_SENSITIVITY;
    const newScale = Math.max(baseScale, Math.min(scale * (1 + delta), baseScale * 6));
    
    // Zoom towards mouse pointer
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - MAP_AREA_W / 2;
    const mouseY = e.clientY - rect.top - MAP_AREA_H / 2;

    const scaleRatio = newScale / scale;
    const newTranslateX = mouseX - (mouseX - translateX) * scaleRatio;
    const newTranslateY = mouseY - (mouseY - translateY) * scaleRatio;

    applyTransform(newScale, newTranslateX, newTranslateY);
  }, [scale, translateX, translateY, baseScale, applyTransform]);

  // Mouse drag start
  const handleMouseDown = useCallback((e) => {
    if (scale <= baseScale) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - translateX, y: e.clientY - translateY });
  }, [scale, baseScale, translateX, translateY]);

  // Mouse drag move
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    applyTransform(scale, newX, newY);
  }, [isDragging, dragStart, scale, applyTransform]);

  // Mouse drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch/mouse pinch-to-zoom handlers
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scaleAnim } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = useCallback((event) => {
    if (event.nativeEvent.oldState === 4) {
      const pinchScale = event.nativeEvent.scale;
      const newScale = Math.max(baseScale, Math.min(scale * pinchScale, baseScale * 6));
      applyTransform(newScale, translateX, translateY);
    }
  }, [scale, baseScale, translateX, translateY, applyTransform]);

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateXAnim, translationY: translateYAnim } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = useCallback((event) => {
    if (event.nativeEvent.oldState === 4) {
      const newX = translateX + event.nativeEvent.translationX;
      const newY = translateY + event.nativeEvent.translationY;
      applyTransform(scale, newX, newY);
    }
  }, [translateX, translateY, scale, applyTransform]);

  // Reset zoom to fit
  const handleResetZoom = () => {
    applyTransform(baseScale, 0, 0);
  };

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

  const stampCount = getStampCount();
  const totalBooths = booths.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PBL e-map</Text>
        <Text style={styles.subtitle}>Scroll/pinch to zoom • Drag to pan • Tap a booth</Text>
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
              <Animated.View
                style={styles.mapContainer}
                ref={mapContainerRef}
                onLayout={onContainerLayout}
              >
                {/* Mouse event overlay for web */}
                {Platform.OS === 'web' && (
                  <View
                    style={StyleSheet.absoluteFillObject}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    pointerEvents="box-none"
                  />
                )}

                <Animated.View
                  style={[
                    styles.zoomableContent,
                    {
                      width: imageSize.width,
                      height: imageSize.height,
                      transform: [
                        { scale: scaleAnim },
                        { translateX: translateXAnim },
                        { translateY: translateYAnim },
                      ],
                    },
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

        {/* Stats overlay - bottom right */}
        <View style={styles.statsOverlay}>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: '#27ae60' }]} />
            <Text style={styles.statText}>{stampCount} Visited</Text>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statDot, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.statText}>{totalBooths - stampCount} Not Visited</Text>
          </View>
        </View>

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
    cursor: 'grab',
  },
  zoomableContent: {
    position: 'relative',
  },
  pinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -35 }],
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 72,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
