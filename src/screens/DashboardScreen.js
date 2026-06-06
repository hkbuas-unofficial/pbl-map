import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { fetchStats, verifyAdmin, exportData } from '../lib/tracking';

const ADMIN_PASSWORD = 'pbl5**';

export default function DashboardScreen() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.log('Stats error:', e.message);
    }
  }, []);

  // Auto-refresh every 10 seconds when authenticated
  useEffect(() => {
    if (!authenticated) return;
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [authenticated, loadStats]);

  const handleLogin = async () => {
    // Local check first (fast)
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
      return;
    }
    // Remote verify as fallback
    try {
      const valid = await verifyAdmin(password);
      if (valid) {
        setAuthenticated(true);
        setPasswordError(false);
      } else {
        setPasswordError(true);
        setPassword('');
      }
    } catch (e) {
      setPasswordError(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pbl-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  };

  if (!authenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginCard}>
          <Text style={styles.loginIcon}>📊</Text>
          <Text style={styles.loginTitle}>Admin Dashboard</Text>
          <Text style={styles.loginSub}>Enter password to view live stats</Text>
          <TextInput
            style={[styles.loginInput, passwordError && styles.loginInputError]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            onSubmitEditing={handleLogin}
            autoFocus
          />
          {passwordError && <Text style={styles.loginError}>Incorrect password</Text>}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Live Dashboard</Text>
        <Text style={styles.headerSub}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {!stats ? (
          <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard label="Total Users" value={stats.totalUsers} color="#3498db" />
              <StatCard label="Active Now" value={stats.activeNow} color="#27ae60" />
              <StatCard label="Redemptions" value={stats.totalRedemptions} color="#e74c3c" />
              <StatCard label="Avg Stamps" value={stats.avgStamps} color="#9b59b6" />
            </View>

            {/* Active Today */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>👥 Active Today</Text>
              <Text style={styles.bigNumber}>{stats.activeToday}</Text>
              <Text style={styles.sectionSub}>unique users in last 24h</Text>
            </View>

            {/* Top Booths */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🏆 Top Booths</Text>
              {stats.topBooths.length === 0 ? (
                <Text style={styles.emptyText}>No booth visits yet</Text>
              ) : (
                stats.topBooths.map((b, i) => (
                  <View key={b.booth_id} style={styles.boothRow}>
                    <Text style={styles.boothRank}>#{i + 1}</Text>
                    <Text style={styles.boothName}>Booth {b.booth_id}</Text>
                    <Text style={styles.boothCount}>{b.visits} visits</Text>
                  </View>
                ))
              )}
            </View>

            {/* Event Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📈 Event Breakdown</Text>
              {stats.eventBreakdown.map((e) => (
                <View key={e.event_type} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{formatEventType(e.event_type)}</Text>
                  <Text style={styles.breakdownCount}>{e.count}</Text>
                </View>
              ))}
            </View>

            {/* Stamp Distribution */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🎫 Stamp Distribution</Text>
              {stats.stampDistribution.length === 0 ? (
                <Text style={styles.emptyText}>No data yet</Text>
              ) : (
                stats.stampDistribution.map((d) => (
                  <View key={d.stamps} style={styles.distRow}>
                    <Text style={styles.distLabel}>{d.stamps} stamps</Text>
                    <View style={styles.distBarBg}>
                      <View
                        style={[
                          styles.distBarFill,
                          {
                            width: `${Math.min(100, (d.users / Math.max(stats.totalUsers, 1)) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.distCount}>{d.users}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Recent Activity */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🕐 Recent Activity</Text>
              {stats.recentEvents.length === 0 ? (
                <Text style={styles.emptyText}>No events yet</Text>
              ) : (
                stats.recentEvents.slice(0, 10).map((e, i) => (
                  <View key={i} style={styles.activityRow}>
                    <Text style={styles.activityType}>{formatEventType(e.event_type)}</Text>
                    {e.booth_id && <Text style={styles.activityBooth}>Booth {e.booth_id}</Text>}
                    <Text style={styles.activityTime}>{formatTime(e.created_at)}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Export Button */}
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Text style={styles.exportBtnText}>📥 Export All Data</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 4 }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatEventType(type) {
  const map = {
    stamp_earned: '✅ Stamp',
    quiz_wrong: '❌ Wrong',
    quiz_locked: '🔒 Locked',
    redemption: '🎁 Redeem',
    booth_tap: '👆 Tap',
    scan: '📷 Scan',
    page_view: '👁 View',
  };
  return map[type] || type;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loginCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  loginSub: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  loginInput: {
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  loginInputError: {
    borderColor: '#e74c3c',
  },
  loginError: {
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 8,
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498db',
  },
  sectionSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  boothRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  boothRank: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
  },
  boothName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  boothCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#555',
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  distLabel: {
    width: 70,
    fontSize: 12,
    color: '#666',
  },
  distBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  distBarFill: {
    height: 8,
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  distCount: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityType: {
    fontSize: 13,
    color: '#555',
    width: 90,
  },
  activityBooth: {
    flex: 1,
    fontSize: 13,
    color: '#888',
  },
  activityTime: {
    fontSize: 11,
    color: '#aaa',
  },
  exportBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
