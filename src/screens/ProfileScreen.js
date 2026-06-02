import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { REDEMPTION_THRESHOLD, REDEMPTION_COST, MAX_ATTEMPTS_PER_BOOTH } from '../hooks/useAppData';

export default function ProfileScreen({ appData }) {
  const { booths, stamps, attempts, redemptions, getStampCount } = appData;
  const stampCount = getStampCount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Event participation stats</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.avatarName}>Event Participant</Text>
          <Text style={styles.avatarSub}>Keep collecting stamps!</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stampCount}</Text>
            <Text style={styles.statLabel}>Stamps</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{redemptions}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{booths.length}</Text>
            <Text style={styles.statLabel}>Total Booths</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Math.round((stampCount / Math.max(booths.length, 1)) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Rules Section */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>📋 Event Rules</Text>
          
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>1</Text>
            <Text style={styles.ruleText}>
              Visit booths and scan their QR codes to earn stamps.
            </Text>
          </View>
          
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>2</Text>
            <Text style={styles.ruleText}>
              Answer a quiz question correctly to earn 1 stamp per booth.
            </Text>
          </View>
          
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>3</Text>
            <Text style={styles.ruleText}>
              You have {MAX_ATTEMPTS_PER_BOOTH} attempts per booth. Fail all and you're locked out.
            </Text>
          </View>
          
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>4</Text>
            <Text style={styles.ruleText}>
              Collect {REDEMPTION_THRESHOLD}+ stamps to redeem souvenirs.
            </Text>
          </View>
          
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>5</Text>
            <Text style={styles.ruleText}>
              Each redemption costs {REDEMPTION_COST} stamps. Leftover stamps carry over!
            </Text>
          </View>
        </View>

        {/* Booth Attempts Detail */}
        <Text style={styles.sectionTitle}>Booth Status</Text>
        {booths.map((booth) => {
          const stamped = !!stamps[booth.booth_id];
          const attemptCount = attempts[booth.booth_id] || 0;
          const locked = attemptCount >= MAX_ATTEMPTS_PER_BOOTH && !stamped;
          
          return (
            <View key={booth.booth_id} style={styles.boothRow}>
              <View style={styles.boothRowLeft}>
                <Text style={styles.boothRowId}>{booth.booth_id}</Text>
                <Text style={styles.boothRowName}>{booth.booth_name}</Text>
              </View>
              <View style={styles.boothRowRight}>
                {stamped ? (
                  <Text style={styles.boothRowStamped}>✓ Stamped</Text>
                ) : locked ? (
                  <Text style={styles.boothRowLocked}>🔒 Locked</Text>
                ) : (
                  <Text style={styles.boothRowAttempts}>
                    {attemptCount}/{MAX_ATTEMPTS_PER_BOOTH} attempts
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  rulesCard: {
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
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3498db',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 1,
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
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  boothRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  boothRowId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3498db',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  boothRowName: {
    fontSize: 14,
    color: '#333',
  },
  boothRowRight: {},
  boothRowStamped: {
    color: '#27ae60',
    fontWeight: '600',
    fontSize: 13,
  },
  boothRowLocked: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 13,
  },
  boothRowAttempts: {
    color: '#888',
    fontSize: 12,
  },
});
