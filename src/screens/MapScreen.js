import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import BoothPin from '../components/BoothPin';
import BoothDetailModal from '../components/BoothDetailModal';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const HEADER_H = 72;
const MAP_AREA_W = SCREEN_W;
const MAP_AREA_H = SCREEN_H - HEADER_H;

// Actual map image dimensions
const MAP_IMG_W = 3800;
const MAP_IMG_H = 3109;

export default function MapScreen({ appData, navigation }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts, getStampCount } = appData;

  const [selectedBooth, setSelectedBooth] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Calculate initial scale so entire map fits in view
  const getInitialScale = useCallback((imgW, imgH) => {
    const scaleX = MAP_AREA_W / imgW;
    const scaleY = MAP_AREA_H / imgH;
    return Math.min(scaleX, scaleY);
  }, []);

  // Zoom/pan state
  const [baseScale, setBaseScale] = useState(() => getInitialScale(MAP_IMG_W, MAP_IMG_H));
  const [scale, setScale] = useState(() => getInitialScale(MAP_IMG_W, MAP_IMG_H));
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const scaleAnim = useRef(new Animated.Value(getInitialScale(MAP_IMG_W, MAP_IMG_H))).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Web-specific refs for mouse events
  const mapRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const translateRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(getInitialScale(MAP_IMG_W, MAP_IMG_H));

  // Keep refs in sync with state
  useEffect(() => {
    translateRef.current = { x: translateX, y: translateY };
  }, [translateX, translateY]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Apply constrained transform
  const applyTransform = useCallback((newScale, newTranslateX, newTranslateY) => {
    const scaledW = MAP_IMG_W * newScale;
    const scaledH = MAP_IMG_H * newScale;
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
  }, [scaleAnim, translateXAnim, translateYAnim]);

  // Web mouse wheel zoom
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    // Need to access the DOM node for wheel events
    const domNode = el._reactInternalFiber?.stateNode || el;
    const target = domNode && domNode.nodeType ? domNode : el;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const currentScale = scaleRef.current;
      const newScale = Math.max(baseScale, Math.min(currentScale * (1 + delta), baseScale * 6));

      const rect = target.getBoundingClientRect ? target.getBoundingClientRect() : { left: 0, top: 0, width: MAP_AREA_W, height: MAP_AREA_H };
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const scaleRatio = newScale / currentScale;
      const newTranslateX = mouseX - (mouseX - translateRef.current.x) * scaleRatio;
      const newTranslateY = mouseY - (mouseY - translateRef.current.y) * scaleRatio;

      applyTransform(newScale, newTranslateX, newTranslateY);
    };

    const handleMouseDown = (e) => {
      if (scaleRef.current <= baseScale) return;
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX - translateRef.current.x,
        y: e.clientY - translateRef.current.y,
      };
      target.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      applyTransform(scaleRef.current, newX, newY);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      target.style.cursor = 'grab';
    };

    // Use the View's DOM element via ref
    const container = target;
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [baseScale, applyTransform]);

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
        <Text style={styles.subtitle}>Scroll to zoom • Drag to pan • Tap a booth</Text>
      </View>

      <View style={styles.mapWrapper}>
        <View
          ref={mapRef}
          style={[
            styles.mapContainer,
            { cursor: scale > baseScale ? 'grab' : 'default' },
          ]}
        >
          <Animated.View
            style={[
              styles.zoomableContent,
              {
                width: MAP_IMG_W,
                height: MAP_IMG_H,
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
                width: MAP_IMG_W,
                height: MAP_IMG_H,
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
        </View>

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
    height: 72,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
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

});
