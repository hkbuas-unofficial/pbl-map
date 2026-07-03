import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GROUP_QUESTIONS } from '../data/groupQuestions';
import { MAX_ATTEMPTS_PER_GROUP } from '../hooks/useAppData';

export default function BoothDetailModal({
  visible,
  booth,
  hasStamp,
  classProgress,
  onClose,
  onScanQR,
}) {
  if (!booth) return null;

  const { total, stamped } = classProgress || { total: 0, stamped: 0 };

  const gradeGroups = Object.values(GROUP_QUESTIONS).filter(g => g.grade === booth.grade);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent card */}
        <View style={styles.card}>
          {/* Header row with close */}
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, 
              stamped > 0 ? styles.badgeGreen : styles.badgeOrange
            ]}>
              <Text style={styles.statusBadgeText}>
                {stamped > 0 ? '✓ STARTED' : `${stamped}/${total} GROUPS`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Class ID & Name */}
          <Text style={styles.boothId}>CLASS {booth.booth_id}</Text>
          <Text style={styles.boothName}>{booth.booth_name}</Text>

          {/* Location */}
          {booth.booth_location ? (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{booth.booth_location}</Text>
            </View>
          ) : null}

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progress</Text>
              <Text style={styles.progressFraction}>{stamped}/{total} groups stamped</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${total > 0 ? (stamped / total) * 100 : 0}%` }]} />
            </View>
          </View>

          {/* Group count preview */}
          <View style={styles.groupCountRow}>
            <Text style={styles.groupCountText}>{gradeGroups.length} groups total · {MAX_ATTEMPTS_PER_GROUP} attempts each</Text>
          </View>

          {/* Action button — always show "Get more questions" */}
          <TouchableOpacity style={styles.scanBtn} onPress={onScanQR}>
            <Text style={styles.scanBtnText}>
              {stamped > 0 ? '📷 Get More Questions' : '📷 Go Scan QR'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(30,30,30,0.92)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: 'rgba(39,174,96,0.2)',
  },
  badgeOrange: {
    backgroundColor: 'rgba(243,156,18,0.2)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  boothId: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  boothName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 14,
    color: '#bbb',
    flexShrink: 1,
  },
  groupCountRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  groupCountText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scanBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressFraction: {
    color: '#bbb',
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
});
