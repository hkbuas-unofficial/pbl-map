import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import QuizModal from '../components/QuizModal';

// Mock QR scanner for web - on mobile, replace with expo-camera
export default function ScanScreen({ appData }) {
  const { booths, hasStamp, isLockedOut, getRemainingAttempts, canAttempt, addStamp, incrementAttempt } = appData;

  const [manualCode, setManualCode] = useState('');
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizBooth, setQuizBooth] = useState(null);
  const [quizRemaining, setQuizRemaining] = useState(0);
  const [scanHistory, setScanHistory] = useState([]);

  const handleScan = (boothId) => {
    const booth = booths.find(b => b.booth_id === boothId.toUpperCase().trim());
    if (!booth) {
      Alert.alert('Invalid QR Code', `No booth found with ID: ${boothId}`);
      return;
    }

    if (hasStamp(booth.booth_id)) {
      Alert.alert('Already Stamped!', `You already have a stamp for ${booth.booth_name}.`);
      return;
    }

    if (isLockedOut(booth.booth_id)) {
      Alert.alert('Locked Out', `You have used all attempts for ${booth.booth_name}.`);
      return;
    }

    setScanHistory(prev => [booth, ...prev.filter(b => b.booth_id !== booth.booth_id)].slice(0, 5));
    setQuizBooth(booth);
    setQuizRemaining(getRemainingAttempts(booth.booth_id));
    setQuizVisible(true);
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
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleScan(manualCode);
      setManualCode('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR Scanner</Text>
        <Text style={styles.subtitle}>Scan booth QR codes to earn stamps</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Camera placeholder - on mobile, use expo-camera */}
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraLabel}>Camera Scanner</Text>
          <Text style={styles.cameraSub}>
            On mobile, this opens the camera.{'\n'}
            On web, use manual entry below.
          </Text>
        </View>

        {/* Manual Entry */}
        <View style={styles.manualBox}>
          <Text style={styles.manualLabel}>Enter Booth Code Manually</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g., A01"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={handleManualSubmit}>
              <Text style={styles.scanBtnText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Buttons */}
        <Text style={styles.sectionTitle}>Quick Scan (Demo)</Text>
        <View style={styles.quickGrid}>
          {booths.map((booth) => {
            const stamped = hasStamp(booth.booth_id);
            const locked = isLockedOut(booth.booth_id);
            return (
              <TouchableOpacity
                key={booth.booth_id}
                style={[
                  styles.quickBtn,
                  stamped && styles.quickBtnStamped,
                  locked && styles.quickBtnLocked,
                ]}
                onPress={() => handleScan(booth.booth_id)}
                disabled={stamped || locked}
              >
                <Text style={styles.quickBtnId}>{booth.booth_id}</Text>
                <Text style={styles.quickBtnName} numberOfLines={1}>
                  {booth.booth_name}
                </Text>
                {stamped && <Text style={styles.quickBtnBadge}>✓</Text>}
                {locked && <Text style={styles.quickBtnBadge}>🔒</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            {scanHistory.map((booth) => (
              <View key={booth.booth_id} style={styles.historyItem}>
                <Text style={styles.historyId}>{booth.booth_id}</Text>
                <Text style={styles.historyName}>{booth.booth_name}</Text>
                <Text style={styles.historyStatus}>
                  {hasStamp(booth.booth_id) ? '✓ Stamped' : isLockedOut(booth.booth_id) ? '🔒 Locked' : '⏳ Pending'}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

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
    paddingBottom: 40,
  },
  cameraPlaceholder: {
    backgroundColor: '#2c3e50',
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  cameraLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cameraSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  manualBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  scanBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    borderRadius: 10,
    justifyContent: 'center',
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  quickBtnStamped: {
    borderColor: '#27ae60',
    backgroundColor: '#e8f5e9',
    opacity: 0.7,
  },
  quickBtnLocked: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffebee',
    opacity: 0.6,
  },
  quickBtnId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quickBtnName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickBtnBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  historyId: {
    fontWeight: 'bold',
    color: '#3498db',
    width: 40,
  },
  historyName: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  historyStatus: {
    fontSize: 12,
    color: '#888',
  },
});
