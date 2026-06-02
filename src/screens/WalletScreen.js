import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
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
  const [staffConfirmVisible, setStaffConfirmVisible] = useState(false);

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
      setStaffConfirmVisible(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stamp Wallet</Text>
        <Text style={styles.subtitle}>Collect stamps and redeem prizes</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stamp Counter Card */}
        <View style={styles.counterCard}>
          <View style={styles.counterRow}>
            <View style={styles.counterItem}>
              <Text style={styles.counterNumber}>{stampCount}</Text>
              <Text style={styles.counterLabel}>Stamps</Text>
            </View>
            <View style={styles.counterDivider} />
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
          <Text style={styles.redeemTitle}>🎁 Souvenir Redemption</Text>
          <Text style={styles.redeemDesc}>
            Collect <Text style={styles.bold}>{REDEMPTION_THRESHOLD}</Text> stamps to redeem a souvenir.
            Each redemption costs <Text style={styles.bold}>{REDEMPTION_COST}</Text> stamps.
          </Text>

          {canRedeem() ? (
            <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
              <Text style={styles.redeemBtnText}>Redeem Souvenir</Text>
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
              <View style={styles.boothIcon}>
                <Text style={{ fontSize: 24 }}>{stamped ? '🏆' : '📍'}</Text>
              </View>
              <View style={styles.boothInfo}>
                <Text style={styles.boothId}>Booth {booth.booth_id}</Text>
                <Text style={styles.boothName}>{booth.booth_name}</Text>
              </View>
              <View style={styles.boothStatus}>
                <Text style={[styles.boothStatusText, stamped && styles.boothStatusStamped]}>
                  {stamped ? 'Collected' : 'Missing'}
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

      {/* Redeem Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={redeemModalVisible}
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {!staffConfirmVisible ? (
              <>
                <Text style={styles.modalIcon}>🎁</Text>
                <Text style={styles.modalTitle}>Ready to Redeem!</Text>
                <Text style={styles.modalText}>
                  You have {stampCount} stamps.{'\n'}
                  Redeeming will cost {REDEMPTION_COST} stamps.
                </Text>
                <Text style={styles.modalSub}>
                  Show this screen to event staff for verification.
                </Text>
                <TouchableOpacity
                  style={styles.staffBtn}
                  onPress={() => setStaffConfirmVisible(true)}
                >
                  <Text style={styles.staffBtnText}>Staff: Tap to Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setRedeemModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalIcon}>👤</Text>
                <Text style={styles.modalTitle}>Staff Verification</Text>
                <Text style={styles.modalText}>
                  Confirm that you have given the souvenir to the participant.
                </Text>
                <Text style={styles.modalWarning}>
                  This will deduct {REDEMPTION_COST} stamps from their wallet.
                </Text>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleStaffConfirm}
                >
                  <Text style={styles.confirmBtnText}>✓ Confirm Redeemed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setStaffConfirmVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  counterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  counterItem: {
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
  },
  counterLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  counterDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  redeemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 16,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  redeemBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  redeemBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  redeemLocked: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 16,
    borderRadius: 12,
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
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  boothItemStamped: {
    borderLeftColor: '#27ae60',
  },
  boothIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  boothInfo: {
    flex: 1,
  },
  boothId: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  boothName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 1,
  },
  boothStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  boothStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  boothStatusStamped: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 56,
    marginBottom: 12,
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
  modalWarning: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  staffBtn: {
    backgroundColor: '#f39c12',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  staffBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnText: {
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
});
