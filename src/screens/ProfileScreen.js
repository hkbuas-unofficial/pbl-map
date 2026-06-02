import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { REDEMPTION_THRESHOLD, REDEMPTION_COST, MAX_ATTEMPTS_PER_BOOTH } from '../hooks/useAppData';

export default function ProfileScreen({ appData }) {
  const { booths, stamps, attempts, redemptions, getStampCount } = appData;
  const stampCount = getStampCount();

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [selectedBoothForQR, setSelectedBoothForQR] = useState(null);

  const handleOpenAdmin = () => {
    setAdminModalVisible(true);
    setSelectedBoothForQR(null);
  };

  const handleSelectBooth = (booth) => {
    setSelectedBoothForQR(booth);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Event participation stats</Text>
          </View>
          <TouchableOpacity style={styles.adminBtn} onPress={handleOpenAdmin}>
            <Text style={styles.adminBtnText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.avatarName}>Event Participant</Text>
          <Text style={styles.avatarSub}>Keep collecting stamps!</Text>
          
          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{stampCount}</Text>
              <Text style={styles.miniStatLabel}>Stamps</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{redemptions}</Text>
              <Text style={styles.miniStatLabel}>Redeemed</Text>
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{Math.round((stampCount / Math.max(booths.length, 1)) * 100)}%</Text>
              <Text style={styles.miniStatLabel}>Done</Text>
            </View>
          </View>
        </View>

        {/* Rules Section */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>📋 Event Rules</Text>
          
          {[
            'Visit booths and scan their QR codes to earn stamps.',
            'Answer a quiz question correctly to earn 1 stamp per booth.',
            `You have ${MAX_ATTEMPTS_PER_BOOTH} attempts per booth. Fail all and you're locked out.`,
            `Collect ${REDEMPTION_THRESHOLD}+ stamps to redeem souvenirs.`,
            `Each redemption costs ${REDEMPTION_COST} stamps. Leftover stamps carry over!`,
          ].map((rule, i) => (
            <View key={i} style={styles.ruleItem}>
              <View style={styles.ruleNumber}>
                <Text style={styles.ruleNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        {/* Booth Status Detail */}
        <Text style={styles.sectionTitle}>Booth Status</Text>
        {booths.map((booth) => {
          const stamped = !!stamps[booth.booth_id];
          const attemptCount = attempts[booth.booth_id] || 0;
          const locked = attemptCount >= MAX_ATTEMPTS_PER_BOOTH && !stamped;
          
          return (
            <View key={booth.booth_id} style={styles.boothRow}>
              <View style={styles.boothRowLeft}>
                <View style={[
                  styles.boothRowDot,
                  stamped && { backgroundColor: '#27ae60' },
                  locked && { backgroundColor: '#e74c3c' },
                ]} />
                <View>
                  <Text style={styles.boothRowId}>Booth {booth.booth_id}</Text>
                  <Text style={styles.boothRowName}>{booth.booth_name}</Text>
                </View>
              </View>
              <View style={styles.boothRowRight}>
                {stamped ? (
                  <View style={styles.statusBadgeGreen}>
                    <Text style={styles.statusBadgeTextGreen}>✓ Stamped</Text>
                  </View>
                ) : locked ? (
                  <View style={styles.statusBadgeRed}>
                    <Text style={styles.statusBadgeTextRed}>🔒 Locked</Text>
                  </View>
                ) : (
                  <Text style={styles.boothRowAttempts}>
                    {attemptCount}/{MAX_ATTEMPTS_PER_BOOTH} tries
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Admin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={adminModalVisible}
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Admin Panel</Text>
              <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {!selectedBoothForQR ? (
              <>
                <Text style={styles.modalSub}>Select a booth to get its QR code data</Text>
                <ScrollView style={styles.boothList}>
                  {booths.map((booth) => (
                    <TouchableOpacity
                      key={booth.booth_id}
                      style={styles.boothSelectRow}
                      onPress={() => handleSelectBooth(booth)}
                    >
                      <Text style={styles.boothSelectId}>{booth.booth_id}</Text>
                      <Text style={styles.boothSelectName}>{booth.booth_name}</Text>
                      <Text style={styles.boothSelectArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.qrBoothName}>{selectedBoothForQR.booth_name}</Text>
                <Text style={styles.qrBoothId}>Booth {selectedBoothForQR.booth_id}</Text>
                
                <View style={styles.qrDataBox}>
                  <Text style={styles.qrDataLabel}>QR Code Content:</Text>
                  <TextInput
                    style={styles.qrDataInput}
                    value={selectedBoothForQR.booth_id}
                    editable={false}
                    selectTextOnFocus
                    multiline
                  />
                  <Text style={styles.qrHint}>
                    Copy this text and paste it into any online QR code generator (e.g., qr-code-generator.com)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setSelectedBoothForQR(null)}
                >
                  <Text style={styles.backBtnText}>← Back to Booth List</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  adminBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminBtnText: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarSub: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
    marginBottom: 16,
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  miniStatNum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  rulesCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 18,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 1,
  },
  ruleNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 4,
  },
  boothRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  boothRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boothRowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f39c12',
  },
  boothRowId: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3498db',
  },
  boothRowName: {
    fontSize: 14,
    color: '#333',
    marginTop: 1,
  },
  boothRowRight: {},
  statusBadgeGreen: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeTextGreen: {
    color: '#27ae60',
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadgeRed: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeTextRed: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 12,
  },
  boothRowAttempts: {
    color: '#888',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 20,
    color: '#888',
    padding: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  boothList: {
    maxHeight: 300,
  },
  boothSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  boothSelectId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    width: 50,
  },
  boothSelectName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  boothSelectArrow: {
    fontSize: 16,
    color: '#888',
  },
  qrBoothName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  qrBoothId: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  qrDataBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  qrDataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  qrDataInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  qrHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 18,
  },
  backBtn: {
    backgroundColor: '#ecf0f1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#555',
    fontSize: 15,
    fontWeight: '600',
  },
});
