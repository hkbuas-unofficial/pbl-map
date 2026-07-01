import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import BoothPin, { PIN_SIZE } from '../components/BoothPin';
import BoothDetailModal from '../components/BoothDetailModal';
import { capture } from '../lib/posthog';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const HEADER_H = 72;

// Actual map image dimensions
const MAP_IMG_W = 1600;
const MAP_IMG_H = 1131;

export default function MapScreen({ appData, navigation }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts, getStampCount, deviceId } = appData;

  const [selectedBooth, setSelectedBooth] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Container size (dynamic)
  const [containerSize, setContainerSize] = useState({
    w: SCREEN_W,
    h: SCREEN_H - HEADER_H,
  });

  // Track container ref for measuring
  const wrapperRef = useRef(null);

  // Measure actual container size
  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current && Platform.OS === 'web') {
        const node = wrapperRef.current;
        // Handle both React Native Web's internal structure and direct DOM
        const el = node._reactInternalFiber?.stateNode || node;
        if (el && el.getBoundingClientRect) {
          const rect = el.getBoundingClientRect();
          setContainerSize({ w: rect.width, h: rect.height });
        } else {
          setContainerSize({ w: SCREEN_W, h: SCREEN_H - HEADER_H });
        }
      }
    };
    measure();
    // Also measure after a short delay to catch layout settling
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Reload on screen resize (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const handleResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      if (newW !== lastW || newH !== lastH) {
        lastW = newW;
        lastH = newH;
        window.location.reload();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const MAP_AREA_W = containerSize.w;
  const MAP_AREA_H = containerSize.h;

  // Calculate initial scale so entire map fits in view
  const getInitialScale = useCallback((imgW, imgH) => {
    const scaleX = MAP_AREA_W / imgW;
    const scaleY = MAP_AREA_H / imgH;
    return Math.min(scaleX, scaleY);
  }, [MAP_AREA_W, MAP_AREA_H]);

  // Zoom/pan state
  const [scale, setScale] = useState(() => getInitialScale(MAP_IMG_W, MAP_IMG_H));
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // Refs for mouse events
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const translateRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(scale);

  // Keep refs in sync
  useEffect(() => {
    translateRef.current = { x: translateX, y: translateY };
  }, [translateX, translateY]);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Initialize / reinitialize when container size changes
  useEffect(() => {
    const initialScale = getInitialScale(MAP_IMG_W, MAP_IMG_H);
    const centerX = (MAP_AREA_W - MAP_IMG_W * initialScale) / 2;
    const centerY = (MAP_AREA_H - MAP_IMG_H * initialScale) / 2;
    setScale(initialScale);
    setTranslateX(centerX);
    setTranslateY(centerY);
    scaleRef.current = initialScale;
    translateRef.current = { x: centerX, y: centerY };
  }, [MAP_AREA_W, MAP_AREA_H, getInitialScale]);

  // Apply constrained transform
  const applyTransform = useCallback((newScale, newTranslateX, newTranslateY) => {
    const scaledW = MAP_IMG_W * newScale;
    const scaledH = MAP_IMG_H * newScale;

    // Allow generous overscroll in all directions
    const border = 400;
    const minX = MAP_AREA_W - scaledW - border;
    const maxX = border;
    const minY = MAP_AREA_H - scaledH - border;
    const maxY = border;

    const constrainedX = Math.max(minX, Math.min(maxX, newTranslateX));
    const constrainedY = Math.max(minY, Math.min(maxY, newTranslateY));

    setScale(newScale);
    setTranslateX(constrainedX);
    setTranslateY(constrainedY);
    translateRef.current = { x: constrainedX, y: constrainedY };
    scaleRef.current = newScale;

    return { x: constrainedX, y: constrainedY };
  }, [MAP_AREA_W, MAP_AREA_H]);

  // Web mouse + touch events
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Get the actual DOM element
    let target = wrapper;
    if (wrapper._reactInternalFiber?.stateNode) {
      target = wrapper._reactInternalFiber.stateNode;
    }
    if (!target || !target.nodeType) return;

    // --- Mouse wheel zoom ---
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const currentScale = scaleRef.current;
      const minScale = getInitialScale(MAP_IMG_W, MAP_IMG_H) * 0.5;
      const maxScale = getInitialScale(MAP_IMG_W, MAP_IMG_H) * 8;
      const newScale = Math.max(minScale, Math.min(currentScale * (1 + delta), maxScale));

      const rect = target.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom towards mouse pointer
      const scaleRatio = newScale / currentScale;
      const newTranslateX = mouseX - (mouseX - translateRef.current.x) * scaleRatio;
      const newTranslateY = mouseY - (mouseY - translateRef.current.y) * scaleRatio;

      applyTransform(newScale, newTranslateX, newTranslateY);
    };

    // --- Mouse drag pan ---
    const handleMouseDown = (e) => {
      const initialScale = getInitialScale(MAP_IMG_W, MAP_IMG_H);
      if (scaleRef.current <= initialScale * 0.99) return;
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

    // --- Touch: pinch to zoom + pan ---
    const touchesRef = { ids: [], start: [], lastCenter: null, lastDist: null };

    const getTouchPos = (t, rect) => ({
      x: t.clientX - rect.left,
      y: t.clientY - rect.top,
    });

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const center = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        // Single finger: start pan
        isDraggingRef.current = true;
        const t = e.touches[0];
        dragStartRef.current = {
          x: t.clientX - translateRef.current.x,
          y: t.clientY - translateRef.current.y,
        };
      } else if (e.touches.length === 2) {
        // Two fingers: start pinch
        isDraggingRef.current = false;
        const rect = target.getBoundingClientRect();
        const t0 = getTouchPos(e.touches[0], rect);
        const t1 = getTouchPos(e.touches[1], rect);
        touchesRef.lastDist = dist(t0, t1);
        touchesRef.lastCenter = center(t0, t1);
        touchesRef.startScale = scaleRef.current;
        touchesRef.startTranslate = { ...translateRef.current };
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        // Single finger pan
        const t = e.touches[0];
        const newX = t.clientX - dragStartRef.current.x;
        const newY = t.clientY - dragStartRef.current.y;
        applyTransform(scaleRef.current, newX, newY);
      } else if (e.touches.length === 2 && touchesRef.lastDist && touchesRef.lastCenter) {
        // Two finger pinch zoom
        const rect = target.getBoundingClientRect();
        const t0 = getTouchPos(e.touches[0], rect);
        const t1 = getTouchPos(e.touches[1], rect);

        const newDist = dist(t0, t1);
        const newCenter = center(t0, t1);

        const minScale = getInitialScale(MAP_IMG_W, MAP_IMG_H) * 0.5;
        const maxScale = getInitialScale(MAP_IMG_W, MAP_IMG_H) * 8;
        const scaleFactor = newDist / touchesRef.lastDist;
        const newScale = Math.max(minScale, Math.min(touchesRef.startScale * scaleFactor, maxScale));

        // Zoom towards pinch center
        const scaleRatio = newScale / touchesRef.startScale;
        const newTranslateX = newCenter.x - (touchesRef.lastCenter.x - touchesRef.startTranslate.x) * scaleRatio;
        const newTranslateY = newCenter.y - (touchesRef.lastCenter.y - touchesRef.startTranslate.y) * scaleRatio;

        applyTransform(newScale, newTranslateX, newTranslateY);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length === 0) {
        isDraggingRef.current = false;
        touchesRef.lastDist = null;
        touchesRef.lastCenter = null;
      } else if (e.touches.length === 1) {
        // Back to single finger: switch to pan mode
        isDraggingRef.current = true;
        touchesRef.lastDist = null;
        touchesRef.lastCenter = null;
        const t = e.touches[0];
        dragStartRef.current = {
          x: t.clientX - translateRef.current.x,
          y: t.clientY - translateRef.current.y,
        };
      }
    };

    target.addEventListener('wheel', handleWheel, { passive: false });
    target.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    target.addEventListener('touchstart', handleTouchStart, { passive: false });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd);
    target.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      target.removeEventListener('wheel', handleWheel);
      target.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [applyTransform, getInitialScale]);

  // Reset zoom to fit
  const handleResetZoom = () => {
    const initialScale = getInitialScale(MAP_IMG_W, MAP_IMG_H);
    const centerX = (MAP_AREA_W - MAP_IMG_W * initialScale) / 2;
    const centerY = (MAP_AREA_H - MAP_IMG_H * initialScale) / 2;
    applyTransform(initialScale, centerX, centerY);
  };

  const handlePinPress = (booth) => {
    capture('booth_tap', { booth_id: booth.booth_id, booth_name: booth.booth_name });
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

  // Compute CSS transform string for web
  const transformStyle = Platform.OS === 'web'
    ? { transform: `translate(${translateX}px, ${translateY}px) scale(${scale})` }
    : {
        transform: [
          { translateX },
          { translateY },
          { scale },
        ],
      };

  const initialScale = getInitialScale(MAP_IMG_W, MAP_IMG_H);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PBL e-map</Text>
        <Text style={styles.subtitle}>Scroll to zoom • Drag to pan • Tap a booth</Text>
      </View>

      <View style={styles.mapWrapper} ref={wrapperRef}>
        {/* Map image layer - transforms with zoom/pan */}
        <View
          style={[
            styles.mapContainer,
            { cursor: scale > initialScale * 0.99 ? 'grab' : 'default' },
          ]}
        >
          <View
            style={[
              styles.zoomableContent,
              Platform.OS === 'web' ? transformStyle : {},
            ]}
            {...(Platform.OS !== 'web' ? { transform: transformStyle.transform } : {})}
          >
            <Image
              source={require('../../assets/map/venue_map.jpg')}
              style={{
                width: MAP_IMG_W,
                height: MAP_IMG_H,
              }}
              resizeMode="stretch"
            />

            {/* Pins layer - transforms with the map */}
            {booths.map((booth) => {
              const mapPixelX = (booth.booth_x / 100) * MAP_IMG_W;
              const mapPixelY = (booth.booth_y / 100) * MAP_IMG_H;
              return (
                <View
                  key={booth.booth_id}
                  style={[
                    styles.pinWrapper,
                    {
                      left: mapPixelX,
                      top: mapPixelY,
                    },
                  ]}
                >
                  <BoothPin
                    booth={booth}
                    hasStamp={hasStamp(booth.booth_id)}
                    onPress={() => handlePinPress(booth)}
                  />
                </View>
              );
            })}
          </View>
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
    backgroundColor: '#fff',
  },
  header: {
    height: HEADER_H,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  mapWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    position: 'relative',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  zoomableContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MAP_IMG_W,
    height: MAP_IMG_H,
    transformOrigin: 'top left',
  },
  pinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -(PIN_SIZE / 2) }, { translateY: -(PIN_SIZE / 2) }], // center the pin
    zIndex: 11,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 72,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
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
    color: '#333',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  zoomBtnText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
