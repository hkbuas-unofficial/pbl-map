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
            {/* Close X */}
            <TouchableOpacity style={styles.closeX} onPress={onClose}>
              <Text style={styles.closeXText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>
                {hasStamp ? '🏆' : isLockedOut ? '🔒' : '📍'}
              </Text>
            </View>

            <Text style={styles.boothId}>BOOTH {booth.booth_id}</Text>
            <Text style={styles.boothName}>{booth.booth_name}</Text>

            {booth.booth_location ? (
              <View style={styles.locationBox}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{booth.booth_location}</Text>
              </View>
            ) : null}

            <View style={styles.statusBox}>
              {hasStamp ? (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#27ae60' }]} />
                  <Text style={styles.statusText}>Stamp Collected</Text>
                  <Text style={styles.statusSub}>Great job! You've earned this stamp.</Text>
                </>
              ) : isLockedOut ? (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#e74c3c' }]} />
                  <Text style={[styles.statusText, styles.lockedText]}>Booth Locked</Text>
                  <Text style={styles.statusSub}>
                    All 5 attempts used. Visit other booths!
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#f39c12' }]} />
                  <Text style={styles.statusText}>Not Visited</Text>
                  <Text style={styles.statusSub}>
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </Text>
                </>
              )}
            </View>

            {!hasStamp && !isLockedOut && (
              <TouchableOpacity style={styles.scanBtn} onPress={onScanQR}>
                <Text style={styles.scanBtnText}>📷 Go Scan QR</Text>
              </TouchableOpacity>
            )}

            {hasStamp && (
              <View style={styles.stampedBox}>
                <Text style={styles.stampedText}>
                  ✓ You have successfully earned a stamp at {booth.booth_name}!
                </Text>
              </View>
            )}

            {isLockedOut && (
              <View style={styles.lockedBox}>
                <Text style={styles.lockedBoxText}>
                  🔒 This booth is locked. You can still explore other booths on the map.
                </Text>
              </View>
            )}
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingTop: 20,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
  },
  closeX: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  closeXText: {
    fontSize: 20,
    color: '#888',
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 36,
  },
  boothId: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  boothName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
    flexShrink: 1,
  },
  statusBox: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  lockedText: {
    color: '#e74c3c',
  },
  statusSub: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },
  scanBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  stampedBox: {
    backgroundColor: '#e8f5e9',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },
  stampedText: {
    color: '#2e7d32',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockedBox: {
    backgroundColor: '#ffebee',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },
  lockedBoxText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
