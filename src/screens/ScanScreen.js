import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QuizScreen from './QuizScreen';
import { capture } from '../lib/posthog';
import { extractBoothId } from '../lib/qrParser';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SCAN_SIZE = Math.min(SCREEN_W, SCREEN_H) * 0.65;
const IS_WEB = Platform.OS === 'web';

export default function ScanScreen({ navigation, appData, initialBoothId }) {
  const { booths, findGroup, hasGroupStamp, isClassComplete, isLockedOut } = appData;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [quizBooth, setQuizBooth] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'notfound' | 'lockedout' | 'already' | 'invalid' | null
  const [scanLineAnim] = useState(new Animated.Value(0));

  // Web QR scanner state
  const [webScanError, setWebScanError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const qrScannerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Handle deep link booth ID on mount
  useEffect(() => {
    if (initialBoothId) {
      processScannedData(initialBoothId);
    }
  }, [initialBoothId]);

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

  const showError = useCallback((message, type = 'general') => {
    setErrorType(type);
    setErrorMsg(message);
    setTimeout(() => {
      setErrorMsg(null);
      setErrorType(null);
      setScanned(false);
    }, 2500);
  }, []);

  const processScannedData = useCallback((data) => {
    if (scanned || showQuiz) return;
    setScanned(true);

    const groupId = extractBoothId(data);
    if (!groupId) {
      showError('Invalid QR code', 'invalid');
      return;
    }
    const found = findGroup(groupId);
    if (!found) {
      showError('404 Booth Not Found', 'notfound');
      return;
    }
    const booth = booths.find(b => b.grade === found.grade);

    if (hasGroupStamp(groupId)) {
      showError(`Already stamped: ${booth.booth_name} · ${found.groupName}`, 'already');
      return;
    }

    if (isLockedOut(groupId)) {
      showError(`Sorry! You have used up all your tries on this booth`, 'lockedout');
      return;
    }

    // Valid group - show quiz
    capture('qr_scan', { group_id: groupId, class_id: found.classId, booth_name: booth.booth_name });
    setQuizBooth({ ...booth, activeGroup: found, groupId });
    setShowQuiz(true);
  }, [scanned, showQuiz, booths, findGroup, hasGroupStamp, isLockedOut, showError]);

  const handleBarCodeScanned = useCallback(({ data }) => {
    processScannedData(data);
  }, [processScannedData]);

  // Web: simple video + jsQR scanning
  useEffect(() => {
    if (!IS_WEB || showQuiz) return;

    let cancelled = false;

    const initScanner = async () => {
      try {
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        videoRef.current = video;

        const container = document.getElementById('web-scanner-container');
        if (!container) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        container.innerHTML = '';
        container.appendChild(video);

        await video.play();

        // Create canvas for QR scanning
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvasRef.current = canvas;

        // Load jsQR dynamically
        const jsQRModule = await import('jsqr');
        const jsQR = jsQRModule.default || jsQRModule;

        let lastScanTime = 0;
        const SCAN_INTERVAL = 300;

        const scanLoop = () => {
          if (cancelled) return;

          const now = Date.now();
          if (now - lastScanTime >= SCAN_INTERVAL) {
            lastScanTime = now;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              processScannedData(code.data);
            }
          }

          animFrameRef.current = requestAnimationFrame(scanLoop);
        };

        scanLoop();
        setWebScanError(null);

      } catch (err) {
        console.error('Web QR scanner init error:', err);
        if (!cancelled) {
          setWebScanError(err.message || 'Failed to start camera');
        }
      }
    };

    initScanner();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const container = document.getElementById('web-scanner-container');
      if (container) container.innerHTML = '';
    };
  }, [showQuiz, processScannedData]);

  const handleQuizClose = () => {
    setShowQuiz(false);
    setQuizBooth(null);
    setScanned(false);
  };

  const handleQuizFinish = () => {
    setShowQuiz(false);
    setQuizBooth(null);
    setScanned(false);
    if (navigation && navigation.navigate) {
      navigation.navigate('Map');
    }
  };

  // If showing quiz, render full-screen quiz
  if (showQuiz && quizBooth) {
    return (
      <QuizScreen
        booth={quizBooth}
        groupId={quizBooth.groupId}
        group={quizBooth.activeGroup}
        onClose={handleQuizClose}
        onFinish={handleQuizFinish}
        appData={appData}
      />
    );
  }

  // Web scanner UI
  if (IS_WEB) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Web scanner container */}
        <View style={styles.camera}>
          <div
            id="web-scanner-container"
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              backgroundColor: '#000',
            }}
          />
        </View>

        {/* Dark overlay with cutout */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={[styles.darkOverlay, { height: (SCREEN_H - SCAN_SIZE) / 2 }]} />
          <View style={styles.middleRow}>
            <View style={[styles.darkOverlay, { width: (SCREEN_W - SCAN_SIZE) / 2 }]} />
            <View style={[styles.scanFrame, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, SCAN_SIZE],
                  }) }] },
                ]}
              />
            </View>
            <View style={[styles.darkOverlay, { width: (SCREEN_W - SCAN_SIZE) / 2 }]} />
          </View>
          <View style={[styles.darkOverlay, { flex: 1 }]} />
        </View>

        {/* UI Layer */}
        <View style={styles.uiLayer} pointerEvents="box-none">
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSub}>Point camera at a booth QR code</Text>
          </View>

          {webScanError && (
            <View style={styles.friendlyPopup}>
              <Text style={styles.friendlyPopupEmoji}>📷</Text>
              <Text style={styles.friendlyPopupTitle}>Camera Access Needed</Text>
              <Text style={styles.friendlyPopupText}>
                Please allow camera usage for QR code scanning.
              </Text>
            </View>
          )}

          {errorMsg && (
            <View style={[
              styles.friendlyPopup,
              errorType === 'notfound' && styles.popupNotFound,
              errorType === 'lockedout' && styles.popupLockedOut,
              errorType === 'already' && styles.popupAlready,
            ]}>
              <Text style={styles.friendlyPopupEmoji}>
                {errorType === 'notfound' ? '🔍' : errorType === 'lockedout' ? '😅' : errorType === 'already' ? '✓' : '⚠️'}
              </Text>
              <Text style={styles.friendlyPopupTitle}>
                {errorType === 'notfound' ? 'Booth Not Found' : errorType === 'lockedout' ? 'Out of Tries' : errorType === 'already' ? 'Already Done' : 'Oops'}
              </Text>
              <Text style={styles.friendlyPopupText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.bottomInfo}>
            <Text style={styles.bottomHint}>
              {booths.filter(b => isClassComplete(b.booth_id)).length} / {booths.length} stamps collected
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Native mobile scanner
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
          barcodeTypes: ['qr', 'aztec', 'datamatrix'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.darkOverlay, { height: (SCREEN_H - SCAN_SIZE) / 2 }]} />
        
        <View style={styles.middleRow}>
          <View style={[styles.darkOverlay, { width: (SCREEN_W - SCAN_SIZE) / 2 }]} />
          
          <View style={[styles.scanFrame, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>
          
          <View style={[styles.darkOverlay, { width: (SCREEN_W - SCAN_SIZE) / 2 }]} />
        </View>
        
        <View style={[styles.darkOverlay, { flex: 1 }]} />
      </View>

      {/* UI Layer */}
      <View style={styles.uiLayer} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <Text style={styles.headerSub}>Point camera at a booth QR code</Text>
        </View>

        {errorMsg && (
          <View style={[
            styles.friendlyPopup,
            errorType === 'notfound' && styles.popupNotFound,
            errorType === 'lockedout' && styles.popupLockedOut,
            errorType === 'already' && styles.popupAlready,
          ]}>
            <Text style={styles.friendlyPopupEmoji}>
              {errorType === 'notfound' ? '🔍' : errorType === 'lockedout' ? '😅' : errorType === 'already' ? '✓' : '⚠️'}
            </Text>
            <Text style={styles.friendlyPopupTitle}>
              {errorType === 'notfound' ? 'Booth Not Found' : errorType === 'lockedout' ? 'Out of Tries' : errorType === 'already' ? 'Already Done' : 'Oops'}
            </Text>
            <Text style={styles.friendlyPopupText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.bottomInfo}>
          <Text style={styles.bottomHint}>
            {booths.filter(b => isClassComplete(b.booth_id)).length} / {booths.length} stamps collected
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
    textShadowRadius: 4,
  },
  friendlyPopup: {
    backgroundColor: 'rgba(30,30,30,0.85)',
    marginHorizontal: 40,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  popupNotFound: {
    borderColor: 'rgba(52,152,219,0.3)',
  },
  popupLockedOut: {
    borderColor: 'rgba(243,156,18,0.3)',
  },
  popupAlready: {
    borderColor: 'rgba(39,174,96,0.3)',
  },
  friendlyPopupEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  friendlyPopupTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  friendlyPopupText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomInfo: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
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
