import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QuizScreen from './QuizScreen';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SCAN_SIZE = Math.min(SCREEN_W, SCREEN_H) * 0.65;

export default function ScanScreen({ appData }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts, canAttempt } = appData;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [quizBooth, setQuizBooth] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanLineAnim] = useState(new Animated.Value(0));

  // Animate scan line
  useEffect(() => {
    if (!showQuiz) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => scanLineAnim.setValue(0);
  }, [showQuiz]);

  const handleBarCodeScanned = useCallback(({ data }) => {
    if (scanned || showQuiz) return;
    setScanned(true);

    const boothId = String(data).trim().toUpperCase();
    const booth = booths.find(b => b.booth_id === boothId);

    if (!booth) {
      setErrorMsg(`No booth found: ${boothId}`);
      setTimeout(() => {
        setErrorMsg(null);
        setScanned(false);
      }, 2000);
      return;
    }

    if (hasStamp(booth.booth_id)) {
      setErrorMsg(`Already stamped: ${booth.booth_name}`);
      setTimeout(() => {
        setErrorMsg(null);
        setScanned(false);
      }, 2000);
      return;
    }

    if (isLockedOut(booth.booth_id)) {
      setErrorMsg(`Locked out: ${booth.booth_name}`);
      setTimeout(() => {
        setErrorMsg(null);
        setScanned(false);
      }, 2000);
      return;
    }

    // Valid booth - show quiz
    setQuizBooth(booth);
    setShowQuiz(true);
  }, [scanned, showQuiz, booths, hasStamp, isLockedOut]);

  const handleQuizClose = () => {
    setShowQuiz(false);
    setQuizBooth(null);
    setScanned(false);
  };

  // If showing quiz, render full-screen quiz
  if (showQuiz && quizBooth) {
    return (
      <QuizScreen
        booth={quizBooth}
        onClose={handleQuizClose}
        appData={appData}
      />
    );
  }

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan booth QR codes.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Top */}
        <View style={[styles.darkOverlay, { height: (SCREEN_H - SCAN_SIZE) / 2 }]} />
        
        {/* Middle row */}
        <View style={styles.middleRow}>
          <View style={[styles.darkOverlay, { width: (SCREEN_W - SCAN_SIZE) / 2 }]} />
          
          {/* Scan frame */}
          <View style={[styles.scanFrame, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>
          
          <View style={[styles.darkOverlay, { width: (SCREEN_W - SCAN_SIZE) / 2 }]} />
        </View>
        
        {/* Bottom */}
        <View style={[styles.darkOverlay, { flex: 1 }]} />
      </View>

      {/* UI Layer */}
      <View style={styles.uiLayer} pointerEvents="box-none">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <Text style={styles.headerSub}>Point camera at a booth QR code</Text>
        </View>

        {/* Error Toast */}
        {errorMsg && (
          <View style={styles.errorToast}>
            <Text style={styles.errorToastText}>{errorMsg}</Text>
          </View>
        )}

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          <View style={styles.boothsRow}>
            {booths.map(b => {
              const stamped = hasStamp(b.booth_id);
              const locked = isLockedOut(b.booth_id);
              let dotColor = '#fff';
              if (stamped) dotColor = '#27ae60';
              else if (locked) dotColor = '#e74c3c';
              
              return (
                <View key={b.booth_id} style={styles.boothDotWrap}>
                  <View style={[styles.boothDot, { backgroundColor: dotColor }]} />
                  <Text style={styles.boothDotLabel}>{b.booth_id}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.bottomHint}>
            {booths.filter(b => hasStamp(b.booth_id)).length} / {booths.length} stamps collected
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  darkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_SIZE,
  },
  scanFrame: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  errorToast: {
    backgroundColor: 'rgba(231,76,60,0.9)',
    marginHorizontal: 40,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorToastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomInfo: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  boothsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  boothDotWrap: {
    alignItems: 'center',
    gap: 4,
  },
  boothDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  boothDotLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  bottomHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
