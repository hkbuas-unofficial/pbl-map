import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import BoothPin from '../components/BoothPin';
import BoothDetailModal from '../components/BoothDetailModal';
import QuizModal from '../components/QuizModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH - 32;
const MAP_HEIGHT = MAP_WIDTH * 1.3; // Aspect ratio

export default function MapScreen({ appData }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts, canAttempt, addStamp, incrementAttempt, getRandomQuestion } = appData;

  const [selectedBooth, setSelectedBooth] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizBooth, setQuizBooth] = useState(null);
  const [quizRemaining, setQuizRemaining] = useState(0);

  const handlePinPress = (booth) => {
    setSelectedBooth(booth);
    setDetailVisible(true);
  };

  const handleScanQR = () => {
    setDetailVisible(false);
    // Simulate QR scan - in real app this would open camera
    // For demo, we directly open quiz
    if (selectedBooth && canAttempt(selectedBooth.booth_id)) {
      setQuizBooth(selectedBooth);
      setQuizRemaining(getRemainingAttempts(selectedBooth.booth_id));
      setQuizVisible(true);
    }
  };

  const handleQuizAnswer = async (isCorrect) => {
    if (!quizBooth) return;
    const boothId = quizBooth.booth_id;

    if (isCorrect) {
      await addStamp(boothId);
    } else {
      const newAttemptCount = await incrementAttempt(boothId);
      setQuizRemaining(5 - newAttemptCount);
    }
  };

  const handleQuizClose = () => {
    setQuizVisible(false);
    setQuizBooth(null);
    // Refresh selected booth data
    if (selectedBooth) {
      setSelectedBooth({ ...selectedBooth });
    }
  };

  // Demo: Use a placeholder map background
  // Replace require('../../assets/map/venue_map.png') with your actual map
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Map</Text>
        <Text style={styles.subtitle}>Tap a booth to explore</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.mapContainer, { width: MAP_WIDTH, height: MAP_HEIGHT }]}>
          {/* Placeholder map background - replace with your uploaded map */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️</Text>
            <Text style={styles.mapPlaceholderLabel}>Venue Map</Text>
            <Text style={styles.mapPlaceholderSub}>
              Upload your map to assets/map/venue_map.png
            </Text>
            
            {/* Grid lines for reference */}
            <View style={styles.gridOverlay}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View key={`v${i}`} style={[styles.gridLineV, { left: `${i * 10}%` }]} />
              ))}
              {Array.from({ length: 13 }).map((_, i) => (
                <View key={`h${i}`} style={[styles.gridLineH, { top: `${i * 10}%` }]} />
              ))}
            </View>
          </View>

          {/* Booth Pins */}
          {booths.map((booth) => (
            <BoothPin
              key={booth.booth_id}
              booth={booth}
              hasStamp={hasStamp(booth.booth_id)}
              onPress={() => handlePinPress(booth)}
            />
          ))}
        </View>
      </ScrollView>

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
      </View>

      {/* Modals */}
      <BoothDetailModal
        visible={detailVisible}
        booth={selectedBooth}
        hasStamp={selectedBooth ? hasStamp(selectedBooth.booth_id) : false}
        remainingAttempts={selectedBooth ? getRemainingAttempts(selectedBooth.booth_id) : 0}
        isLockedOut={selectedBooth ? isLockedOut(selectedBooth.booth_id) : false}
        onClose={() => setDetailVisible(false)}
        onScanQR={handleScanQR}
      />

      <QuizModal
        visible={quizVisible}
        booth={quizBooth}
        onClose={handleQuizClose}
        onAnswer={handleQuizAnswer}
        remainingAttempts={quizRemaining}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  mapContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 64,
    marginBottom: 8,
  },
  mapPlaceholderLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
});
