import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GROUP_QUESTIONS } from '../data/groupQuestions';

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
              hasStamp ? styles.badgeGreen : styles.badgeOrange
            ]}>
              <Text style={styles.statusBadgeText}>
                {hasStamp ? '✓ COMPLETE' : `${stamped}/${total} GROUPS`}
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

          {/* Group list preview */}
          <View style={styles.groupsRow}>
            {gradeGroups.map(group => (
              <View key={group.groupId} style={styles.groupPill}>
                <Text style={styles.groupPillText}>{group.classId.split(' ').pop()}-{group.groupName.replace('Group ', '')}</Text>
              </View>
            ))}
          </View>

          {/* Action button */}
          {!hasStamp && (
            <TouchableOpacity style={styles.scanBtn} onPress={onScanQR}>
              <Text style={styles.scanBtnText}>📷 Go Scan QR</Text>
            </TouchableOpacity>
          )}

          {hasStamp && (
            <View style={styles.successRow}>
              <Text style={styles.successText}>🏆 All groups complete!</Text>
            </View>
          )}
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
  groupsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  groupPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupPillText: {
    color: '#fff',
    fontSize: 12,
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
  successRow: {
    backgroundColor: 'rgba(39,174,96,0.15)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  successText: {
    color: '#27ae60',
    fontSize: 15,
    fontWeight: '600',
  },
});
