import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { REDEMPTION_COST } from '../hooks/useAppData';
import { capture } from '../lib/posthog';

const { width: SCREEN_W } = Dimensions.get('window');

const STAMP_EMPTY_IMG = require('../../assets/stamp_empty.png');
const STAMP_FILLED_IMG = require('../../assets/stamp_filled.png');
const STAMP_REDEEM_IMG = require('../../assets/stamp_redeem.png');

export default function WalletScreen({ appData }) {
  const {
    booths,
    redemptions,
    getStampCount,
    isClassComplete,
    canRedeem,
    redeemSouvenir,
  } = appData;

  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [showStaffScreen, setShowStaffScreen] = useState(false);

  const stampCount = getStampCount();
  const totalBooths = booths.length;

  // Build stamp card items: groups of up to 3 stamps, with a redeem slot after each full group
  const items = [];
  let remaining = stampCount;
  while (remaining > 0) {
    const groupSize = Math.min(REDEMPTION_COST, remaining);
    for (let i = 0; i < groupSize; i++) {
      items.push({ type: 'stamp', filled: true });
    }
    remaining -= groupSize;
    if (groupSize === REDEMPTION_COST) {
      items.push({ type: 'redeem' });
    }
  }

  const stampsUntilNextPrize = REDEMPTION_COST - (stampCount % REDEMPTION_COST);

  // Only completed (stamped) booths for history
  const completedBooths = booths.filter(b => isClassComplete(b.booth_id));

  const handleRedeem = () => {
    if (!canRedeem()) {
      Alert.alert(
        'Not Enough Stamps',
        `You need stamps to redeem. You have ${stampCount}.`
      );
      return;
    }
    setRedeemModalVisible(true);
  };

  const handleStaffConfirm = async () => {
    const success = await redeemSouvenir();
    if (success) {
      capture('redemption', { stamps_used: REDEMPTION_COST });
      setShowStaffScreen(false);
      setRedeemModalVisible(false);
      Alert.alert('Success!', `Souvenir redeemed! Stamps deducted.`);
    } else {
      Alert.alert('Error', 'Could not redeem. Please try again.');
    }
  };

  // Calculate grid layout: aim for roughly square-ish grid
  // If cardSlots = 3 → 1 row of 3, or stack vertically on narrow screens
  // We use a vertical stack (column) approach for the stamp card

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stamp Wallet</Text>
        <Text style={styles.subtitle}>Collect stamps and redeem prizes</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stamp Card - only show when user has stamps */}
        {stampCount > 0 && (
          <View style={styles.stampCardContainer}>
            <View style={styles.stampCard}>
              {/* Stamp slots in a 2-column grid */}
              <View style={styles.stampGrid}>
                {items.map((item, index) => {
                  if (item.type === 'redeem') {
                    return (
                      <TouchableOpacity key={`redeem-${index}`} style={styles.stampSlot} onPress={handleRedeem}>
                        <Image
                          source={STAMP_REDEEM_IMG}
                          style={styles.stampImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <View key={`stamp-${index}`} style={styles.stampSlot}>
                      <Image
                        source={item.filled ? STAMP_FILLED_IMG : STAMP_EMPTY_IMG}
                        style={styles.stampImage}
                        resizeMode="contain"
                      />
                    </View>
                  );
                })}
              </View>
            </View>
            <Text style={styles.stampCardLabel}>
              {stampCount} stamps · {stampsUntilNextPrize} more for next prize
            </Text>
          </View>
        )}

        {/* Stats summary */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stampCount}</Text>
            <Text style={styles.statLabel}>Total Stamps</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{redemptions}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalBooths - stampCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Completed Booths History */}
        {completedBooths.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed Booths</Text>
            <View style={styles.historyList}>
              {completedBooths.map((booth) => (
                <View key={booth.booth_id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Text style={{ fontSize: 18 }}>🏆</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyId}>Booth {booth.booth_id}</Text>
                    <Text style={styles.historyName}>{booth.booth_name}</Text>
                  </View>
                  <View style={styles.historyStatus}>
                    <Text style={styles.historyStatusText}>✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>

      {/* Redeem Modal (participant view) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={redeemModalVisible}
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconCircle}>
              <Text style={{ fontSize: 48 }}>🎁</Text>
            </View>
            <Text style={styles.modalTitle}>Ready to Redeem!</Text>
            <Text style={styles.modalText}>
              You have <Text style={styles.bold}>{stampCount}</Text> stamps.{'\n'}
              Redeeming will cost <Text style={styles.bold}>{REDEMPTION_COST}</Text> stamps.
            </Text>
            <Text style={styles.modalSub}>
              Show this screen to event staff for verification.
            </Text>
            <TouchableOpacity
              style={styles.staffBtn}
              onPress={() => {
                setRedeemModalVisible(false);
                setShowStaffScreen(true);
              }}
            >
              <Text style={styles.staffBtnText}>👤 Staff: Tap to Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setRedeemModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-screen Staff Verification */}
      {showStaffScreen && (
        <View style={styles.staffContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
          
          <View style={styles.staffBgTop} />
          <View style={styles.staffBgBottom} />

          <View style={styles.staffHeader}>
            <TouchableOpacity
              style={styles.staffBackBtn}
              onPress={() => setShowStaffScreen(false)}
            >
              <Text style={styles.staffBackText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.staffHeaderTitle}>Staff Verification</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.staffScroll}
            contentContainerStyle={styles.staffScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.staffIconCircle}>
              <Text style={{ fontSize: 56 }}>👤</Text>
            </View>

            <Text style={styles.staffTitle}>Staff Only</Text>
            <Text style={styles.staffSubtitle}>
              Please verify the participant has received their souvenir.
            </Text>

            <View style={styles.staffSummaryCard}>
              <Text style={styles.staffSummaryTitle}>Participant Summary</Text>
              <View style={styles.staffSummaryRow}>
                <Text style={styles.staffSummaryLabel}>Current Stamps</Text>
                <Text style={styles.staffSummaryValue}>{stampCount}</Text>
              </View>
              <View style={styles.staffSummaryRow}>
                <Text style={styles.staffSummaryLabel}>Redemption Cost</Text>
                <Text style={[styles.staffSummaryValue, styles.staffSummaryDeduction]}>
                  -{REDEMPTION_COST}
                </Text>
              </View>
              <View style={styles.staffSummaryDivider} />
              <View style={styles.staffSummaryRow}>
                <Text style={styles.staffSummaryLabel}>Remaining After</Text>
                <Text style={styles.staffSummaryValue}>{stampCount - REDEMPTION_COST}</Text>
              </View>
              <View style={styles.staffSummaryRow}>
                <Text style={styles.staffSummaryLabel}>Total Redemptions</Text>
                <Text style={styles.staffSummaryValue}>{redemptions}</Text>
              </View>
            </View>

            <View style={styles.staffWarningBox}>
              <Text style={styles.staffWarningIcon}>⚠️</Text>
              <Text style={styles.staffWarningText}>
                This action cannot be undone. Tapping "Confirm Redeemed" will permanently deduct {REDEMPTION_COST} stamps from this participant's wallet.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.staffConfirmBtn}
              onPress={handleStaffConfirm}
            >
              <Text style={styles.staffConfirmBtnText}>✓ Confirm Redeemed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.staffCancelBtn}
              onPress={() => setShowStaffScreen(false)}
            >
              <Text style={styles.staffCancelBtnText}>Cancel — Go Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const SLOT_SIZE = 80;

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
  // Stamp Card - horizontal wrap
  stampCardContainer: {
    alignItems: 'stretch',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  stampCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  stampSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampImage: {
    width: SLOT_SIZE * 0.9,
    height: SLOT_SIZE * 0.9,
  },
  stampCardLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 4,
  },
  // History List
  historyList: {
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyId: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3498db',
  },
  historyName: {
    fontSize: 14,
    color: '#333',
    marginTop: 1,
  },
  historyStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyStatusText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  staffBtn: {
    backgroundColor: '#f39c12',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  staffBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 15,
  },
  // Staff screen
  staffContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
    zIndex: 100,
  },
  staffBgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#16213e',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  staffBgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: '#0f3460',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    opacity: 0.3,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  staffBackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  staffBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  staffHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  staffScroll: {
    flex: 1,
  },
  staffScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  staffIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  staffTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  staffSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  staffSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  staffSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  staffSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  staffSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  staffSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  staffSummaryDeduction: {
    color: '#e74c3c',
  },
  staffSummaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  staffWarningBox: {
    backgroundColor: 'rgba(243,156,18,0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.3)',
    alignItems: 'center',
  },
  staffWarningIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  staffWarningText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  staffConfirmBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  staffConfirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  staffCancelBtn: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  staffCancelBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },
});
