import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function BoothDetailModal({
  visible,
  booth,
  hasStamp,
  remainingAttempts,
  isLockedOut,
  onClose,
  onScanQR,
}) {
  if (!booth) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.boothId}>Booth {booth.booth_id}</Text>
            <Text style={styles.boothName}>{booth.booth_name}</Text>

            <View style={styles.statusBox}>
              {hasStamp ? (
                <>
                  <Text style={styles.statusIcon}>🎉</Text>
                  <Text style={styles.statusText}>Stamp Collected!</Text>
                </>
              ) : isLockedOut ? (
                <>
                  <Text style={styles.statusIcon}>🔒</Text>
                  <Text style={[styles.statusText, styles.lockedText]}>
                    Locked Out
                  </Text>
                  <Text style={styles.subText}>
                    You have used all {5} attempts.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.statusIcon}>📍</Text>
                  <Text style={styles.statusText}>Not Visited</Text>
                  <Text style={styles.subText}>
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </Text>
                </>
              )}
            </View>

            {!hasStamp && !isLockedOut && (
              <TouchableOpacity style={styles.scanBtn} onPress={onScanQR}>
                <Text style={styles.scanBtnText}>📷 Scan QR Code</Text>
              </TouchableOpacity>
            )}

            {hasStamp && (
              <View style={styles.stampedBox}>
                <Text style={styles.stampedText}>
                  You have successfully earned a stamp at this booth!
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  boothId: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  boothName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 20,
  },
  statusBox: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  lockedText: {
    color: '#e74c3c',
  },
  subText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  scanBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stampedBox: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stampedText: {
    color: '#2e7d32',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeBtn: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
});
