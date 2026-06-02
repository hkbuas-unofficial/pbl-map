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
} from 'react-native';
import { REDEMPTION_THRESHOLD, REDEMPTION_COST } from '../hooks/useAppData';

export default function WalletScreen({ appData }) {
  const {
    booths,
    stamps,
    redemptions,
    getStampCount,
    hasStamp,
    canRedeem,
    redeemSouvenir,
    resetAll,
  } = appData;

  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [showStaffScreen, setShowStaffScreen] = useState(false);

  const stampCount = getStampCount();
  const totalBooths = booths.length;
  const progress = totalBooths > 0 ? stampCount / totalBooths : 0;

  const handleRedeem = () => {
    if (!canRedeem()) {
      Alert.alert(
        'Not Enough Stamps',
        `You need ${REDEMPTION_THRESHOLD} stamps to redeem. You have ${stampCount}.`
      );
      return;
    }
    setRedeemModalVisible(true);
  };

  const handleStaffConfirm = async () => {
    const success = await redeemSouvenir();
    if (success) {
      setShowStaffScreen(false);
      setRedeemModalVisible(false);
      Alert.alert('Success!', `Souvenir redeemed! ${REDEMPTION_COST} stamps deducted.`);
    } else {
      Alert.alert('Error', 'Could not redeem. Please try again.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all stamps, attempts, and redemptions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            Alert.alert('Reset Complete', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  // Full-screen staff verification page
  if (showStaffScreen) {
    return (
      <View style={styles.staffContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        
        {/* Background shapes */}
        <View style={styles.staffBgTop} />
        <View style={styles.staffBgBottom} />

        {/* Header */}
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
          {/* Staff Icon */}
          <View style={styles.staffIconCircle}>
            <Text style={{ fontSize: 56 }}>👤</Text>
          </View>

          <Text style={styles.staffTitle}>Staff Only</Text>
          <Text style={styles.staffSubtitle}>
            Please verify the participant has received their souvenir.
          </Text>

          {/* Participant Summary Card */}
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

          {/* Warning */}
          <View style={styles.staffWarningBox}>
            <Text style={styles.staffWarningIcon}>⚠️</Text>
            <Text style={styles.staffWarningText}>
              This action cannot be undone. Tapping "Confirm Redeemed" will permanently deduct {REDEMPTION_COST} stamps from this participant's wallet.
            </Text>
          </View>

          {/* Action Buttons */}
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
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stamp Wallet</Text>
        <Text style={styles.subtitle}>Collect stamps and redeem prizes</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stamp Counter Card */}
        <View style={styles.counterCard}>
          <View style={styles.stampCircle}>
            <Text style={styles.stampNumber}>{stampCount}</Text>
            <Text style={styles.stampLabel}>STAMPS</Text>
          </View>
          
          <View style={styles.counterRow}>
            <View style={styles.counterItem}>
              <Text style={styles.counterNumber}>{redemptions}</Text>
              <Text style={styles.counterLabel}>Redeemed</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.counterItem}>
              <Text style={styles.counterNumber}>{totalBooths - stampCount}</Text>
              <Text style={styles.counterLabel}>Remaining</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {stampCount} / {totalBooths} booths visited
            </Text>
          </View>
        </View>

        {/* Redeem Section */}
        <View style={styles.redeemCard}>
          <View style={styles.redeemIcon}>
            <Text style={{ fontSize: 40 }}>🎁</Text>
          </View>
          <Text style={styles.redeemTitle}>Souvenir Redemption</Text>
          <Text style={styles.redeemDesc}>
            Collect <Text style={styles.bold}>{REDEMPTION_THRESHOLD}</Text> stamps to redeem a souvenir.
            Each redemption costs <Text style={styles.bold}>{REDEMPTION_COST}</Text> stamps.
          </Text>

          {canRedeem() ? (
            <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
              <Text style={styles.redeemBtnText}>🎁 Redeem Souvenir</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.redeemLocked}>
              <Text style={styles.redeemLockedText}>
                {REDEMPTION_THRESHOLD - stampCount} more stamp{REDEMPTION_THRESHOLD - stampCount !== 1 ? 's' : ''} needed
              </Text>
            </View>
          )}
        </View>

        {/* Booth List */}
        <Text style={styles.sectionTitle}>Booth Collection</Text>
        {booths.map((booth) => {
          const stamped = hasStamp(booth.booth_id);
          return (
            <View
              key={booth.booth_id}
              style={[styles.boothItem, stamped && styles.boothItemStamped]}
            >
              <View style={[styles.boothIcon, stamped && styles.boothIconStamped]}>
                <Text style={{ fontSize: 22 }}>{stamped ? '🏆' : '📍'}</Text>
              </View>
              <View style={styles.boothInfo}>
                <Text style={styles.boothId}>Booth {booth.booth_id}</Text>
                <Text style={styles.boothName}>{booth.booth_name}</Text>
              </View>
              <View style={[styles.boothStatus, stamped && styles.boothStatusStamped]}>
                <Text style={[styles.boothStatusText, stamped && styles.boothStatusTextStamped]}>
                  {stamped ? '✓ Collected' : '○ Missing'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset All Data (Debug)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Redeem Modal (first step - participant view) */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  // ========== MAIN WALLET SCREEN ==========
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
  counterCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  stampCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#bbdefb',
  },
  stampNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  stampLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 1,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  counterItem: {
    alignItems: 'center',
    flex: 1,
  },
  counterNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  counterLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  progressContainer: {
    width: '100%',
    marginTop: 4,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  redeemCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  redeemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  redeemDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 18,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  redeemBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  redeemLocked: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  redeemLockedText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 4,
  },
  boothItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  boothItemStamped: {
    borderLeftColor: '#27ae60',
  },
  boothIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  boothIconStamped: {
    backgroundColor: '#e8f5e9',
  },
  boothInfo: {
    flex: 1,
  },
  boothId: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  boothName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 1,
  },
  boothStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  boothStatusStamped: {
    backgroundColor: '#e8f5e9',
  },
  boothStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  boothStatusTextStamped: {
    color: '#27ae60',
  },
  resetBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#e74c3c',
    fontSize: 14,
  },

  // ========== REDEEM MODAL (Participant) ==========
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

  // ========== FULL-SCREEN STAFF VERIFICATION ==========
  staffContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
