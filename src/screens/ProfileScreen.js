import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { REDEMPTION_THRESHOLD, REDEMPTION_COST, MAX_ATTEMPTS_PER_BOOTH } from '../hooks/useAppData';
import { fetchStats, exportData } from '../lib/tracking';
import LineChart from '../components/LineChart';
import PieChart from '../components/PieChart';

const ADMIN_PASSWORD = 'pbl5**';

function formatEventType(type) {
  const map = {
    stamp_earned: '✅ Stamp Earned',
    quiz_locked: '🔒 Locked Out',
    redemption: '🎁 Redemption',
    booth_tap: '👆 Booth Tap',
    scan: '📷 QR Scan',
  };
  return map[type] || type;
}

export default function ProfileScreen({ appData }) {
  const { booths, stamps, attempts, redemptions, getStampCount, addStamp, resetAll, saveAttempts } = appData;
  const stampCount = getStampCount();

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'stamps' | 'reset' | 'quiz'
  const [selectedBoothForQuiz, setSelectedBoothForQuiz] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [stampNumberInput, setStampNumberInput] = useState(String(stampCount));

  // Dashboard state
  const [dashStats, setDashStats] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashLastUpdated, setDashLastUpdated] = useState(null);

  const loadDashStats = useCallback(async () => {
    setDashLoading(true);
    try {
      const data = await fetchStats();
      setDashStats(data);
      setDashLastUpdated(new Date());
    } catch (e) {
      console.log('Dashboard stats error:', e.message);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || adminTab !== 'dashboard') return;
    loadDashStats();
    const interval = setInterval(loadDashStats, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, adminTab, loadDashStats]);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pbl-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      Alert.alert('Export failed', e.message);
    }
  };

  const handleOpenAdmin = () => {
    setAdminModalVisible(true);
    setPasswordInput('');
    setPasswordError(false);
    setIsAuthenticated(false);
    setAdminTab('dashboard');
    setSelectedBoothForQuiz(null);
    setSelectedQuestion(null);
    setSelectedAnswer(null);
    setStampNumberInput(String(stampCount));
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  const handleCloseAdmin = () => {
    setAdminModalVisible(false);
    setIsAuthenticated(false);
    setPasswordInput('');
    setPasswordError(false);
  };

  const handleSetStampCount = async () => {
    const count = parseInt(stampNumberInput, 10);
    if (isNaN(count) || count < 0 || count > booths.length) {
      Alert.alert('Invalid', `Enter a number between 0 and ${booths.length}`);
      return;
    }
    // Set stamps for first N booths
    const newStamps = {};
    for (let i = 0; i < count; i++) {
      newStamps[booths[i].booth_id] = true;
    }
    await appData.saveStamps(newStamps);
    Alert.alert('Success', `Stamp count set to ${count}`);
  };

  const handleResetAll = async () => {
    Alert.alert(
      'Confirm Reset',
      'This will clear ALL stamps, attempts, and redemptions. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            setStampNumberInput('0');
            Alert.alert('Reset Complete', 'All progress has been cleared.');
          },
        },
      ]
    );
  };

  const handleSelectBoothForQuiz = (booth) => {
    setSelectedBoothForQuiz(booth);
    setSelectedQuestion(null);
    setSelectedAnswer(null);
  };

  const handleSelectQuestion = (question, index) => {
    setSelectedQuestion({ ...question, _index: index });
    setSelectedAnswer(null);
  };

  const handleAnswerQuestion = async () => {
    if (!selectedBoothForQuiz || !selectedAnswer) return;
    const isCorrect = selectedAnswer === selectedQuestion.answer;
    if (isCorrect) {
      await addStamp(selectedBoothForQuiz.booth_id);
      Alert.alert('Correct!', `Stamp awarded for ${selectedBoothForQuiz.booth_name}`);
    } else {
      // Wrong answer - increment attempts
      const newAttempts = { ...attempts, [selectedBoothForQuiz.booth_id]: (attempts[selectedBoothForQuiz.booth_id] || 0) + 1 };
      await saveAttempts(newAttempts);
      Alert.alert('Wrong Answer', 'Attempt recorded. No stamp awarded.');
    }
    setSelectedQuestion(null);
    setSelectedAnswer(null);
  };

  const renderPasswordScreen = () => (
    <View style={styles.passwordScreen}>
      <Text style={styles.passwordTitle}>🔒 Admin Access</Text>
      <Text style={styles.passwordSub}>Enter password to continue</Text>
      <TextInput
        style={[styles.passwordInput, passwordError && styles.passwordInputError]}
        value={passwordInput}
        onChangeText={setPasswordInput}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        onSubmitEditing={handlePasswordSubmit}
        autoFocus
      />
      {passwordError && (
        <Text style={styles.passwordError}>Incorrect password</Text>
      )}
      <TouchableOpacity style={styles.passwordBtn} onPress={handlePasswordSubmit}>
        <Text style={styles.passwordBtnText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAdminContent = () => (
    <View style={styles.adminContent}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, adminTab === 'dashboard' && styles.tabActive]}
          onPress={() => setAdminTab('dashboard')}
        >
          <Text style={[styles.tabText, adminTab === 'dashboard' && styles.tabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, adminTab === 'stamps' && styles.tabActive]}
          onPress={() => setAdminTab('stamps')}
        >
          <Text style={[styles.tabText, adminTab === 'stamps' && styles.tabTextActive]}>
            Set Stamps
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, adminTab === 'quiz' && styles.tabActive]}
          onPress={() => { setAdminTab('quiz'); setSelectedBoothForQuiz(null); setSelectedQuestion(null); }}
        >
          <Text style={[styles.tabText, adminTab === 'quiz' && styles.tabTextActive]}>
            Quiz
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, adminTab === 'reset' && styles.tabActive]}
          onPress={() => setAdminTab('reset')}
        >
          <Text style={[styles.tabText, adminTab === 'reset' && styles.tabTextActive]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <ScrollView style={styles.tabContent}>
        {adminTab === 'dashboard' && (
          <View style={styles.tabPanel}>
            <View style={styles.dashHeader}>
              <Text style={styles.panelTitle}>📊 Live Stats</Text>
              {dashLastUpdated && (
                <Text style={styles.dashUpdated}>Updated {dashLastUpdated.toLocaleTimeString()}</Text>
              )}
            </View>

            {dashLoading && !dashStats && (
              <Text style={styles.dashLoading}>Loading stats...</Text>
            )}

            {dashStats && (
              <>
                <View style={styles.dashGrid}>
                  <View style={[styles.dashCard, { borderTopColor: '#3498db' }]}>
                    <Text style={[styles.dashCardNum, { color: '#3498db' }]}>{dashStats.totalUsers}</Text>
                    <Text style={styles.dashCardLabel}>Total Users</Text>
                  </View>
                  <View style={[styles.dashCard, { borderTopColor: '#27ae60' }]}>
                    <Text style={[styles.dashCardNum, { color: '#27ae60' }]}>{dashStats.activeNow}</Text>
                    <Text style={styles.dashCardLabel}>Active Now</Text>
                  </View>
                  <View style={[styles.dashCard, { borderTopColor: '#e74c3c' }]}>
                    <Text style={[styles.dashCardNum, { color: '#e74c3c' }]}>{dashStats.totalRedemptions}</Text>
                    <Text style={styles.dashCardLabel}>Redemptions</Text>
                  </View>
                  <View style={[styles.dashCard, { borderTopColor: '#9b59b6' }]}>
                    <Text style={[styles.dashCardNum, { color: '#9b59b6' }]}>{dashStats.avgStamps}</Text>
                    <Text style={styles.dashCardLabel}>Avg Stamps</Text>
                  </View>
                </View>

                <View style={styles.dashSection}>
                  <Text style={styles.dashSectionTitle}>👥 Total Visitors (Last 20 Hours)</Text>
                  <Text style={styles.dashSectionSub}>15-minute buckets</Text>
                  {dashStats.visitorGraph && dashStats.visitorGraph.length > 0 ? (
                    <LineChart
                      data={dashStats.visitorGraph}
                      width={360}
                      height={180}
                      lineColor="#3498db"
                    />
                  ) : (
                    <Text style={styles.dashEmpty}>No visitor data yet</Text>
                  )}
                </View>

                <View style={styles.dashSection}>
                  <Text style={styles.dashSectionTitle}>🏆 Booth Visits</Text>
                  {dashStats.topBooths.length === 0 ? (
                    <Text style={styles.dashEmpty}>No visits yet</Text>
                  ) : (
                    <PieChart
                      data={dashStats.topBooths.map((b) => ({
                        label: `Booth ${b.booth_id}`,
                        value: b.visits,
                      }))}
                      width={320}
                      height={240}
                    />
                  )}
                </View>

                <View style={styles.dashSection}>
                  <Text style={styles.dashSectionTitle}>📈 Events</Text>
                  {dashStats.eventBreakdown.length === 0 ? (
                    <Text style={styles.dashEmpty}>No events yet</Text>
                  ) : (
                    dashStats.eventBreakdown.map((e) => (
                      <View key={e.event_type} style={styles.dashRow}>
                        <Text style={styles.dashRowText}>{formatEventType(e.event_type)}</Text>
                        <Text style={styles.dashRowCount}>{e.count}</Text>
                      </View>
                    ))
                  )}
                </View>

                <TouchableOpacity style={styles.dashExportBtn} onPress={handleExport}>
                  <Text style={styles.dashExportText}>📥 Export All Data</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {adminTab === 'stamps' && (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Set Stamp Count</Text>
            <Text style={styles.panelDesc}>
              Manually set how many booths are stamped (0-{booths.length}).
              This will stamp the first N booths in order.
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.numberInput}
                value={stampNumberInput}
                onChangeText={setStampNumberInput}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.inputLabel}> / {booths.length} booths</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSetStampCount}>
              <Text style={styles.actionBtnText}>Apply Stamp Count</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.panelTitle}>Current Stamps</Text>
            {booths.map(booth => {
              const stamped = !!stamps[booth.booth_id];
              return (
                <View key={booth.booth_id} style={styles.stampRow}>
                  <View style={[styles.stampDot, stamped && styles.stampDotGreen]} />
                  <Text style={styles.stampName}>{booth.booth_id} - {booth.booth_name}</Text>
                  <Text style={[styles.stampStatus, stamped && styles.stampStatusGreen]}>
                    {stamped ? '✓ Stamped' : 'Not stamped'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {adminTab === 'quiz' && (
          <View style={styles.tabPanel}>
            {!selectedBoothForQuiz ? (
              <>
                <Text style={styles.panelTitle}>Select a Booth</Text>
                <Text style={styles.panelDesc}>Choose a booth to answer its quiz questions.</Text>
                {booths.map(booth => {
                  const stamped = !!stamps[booth.booth_id];
                  const locked = (attempts[booth.booth_id] || 0) >= MAX_ATTEMPTS_PER_BOOTH && !stamped;
                  return (
                    <TouchableOpacity
                      key={booth.booth_id}
                      style={styles.boothQuizRow}
                      onPress={() => handleSelectBoothForQuiz(booth)}
                    >
                      <View style={styles.boothQuizLeft}>
                        <Text style={styles.boothQuizId}>{booth.booth_id}</Text>
                        <Text style={styles.boothQuizName}>{booth.booth_name}</Text>
                      </View>
                      <View style={styles.boothQuizRight}>
                        {stamped && <Text style={styles.badgeGreen}>Stamped</Text>}
                        {locked && <Text style={styles.badgeRed}>Locked</Text>}
                        {!stamped && !locked && (
                          <Text style={styles.attemptsText}>
                            {MAX_ATTEMPTS_PER_BOOTH - (attempts[booth.booth_id] || 0)} left
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : !selectedQuestion ? (
              <>
                <TouchableOpacity onPress={() => setSelectedBoothForQuiz(null)}>
                  <Text style={styles.backLink}>← Back to Booths</Text>
                </TouchableOpacity>
                <Text style={styles.panelTitle}>{selectedBoothForQuiz.booth_name}</Text>
                <Text style={styles.panelDesc}>Select a question to answer:</Text>
                {selectedBoothForQuiz.questions.map((q, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.questionRow}
                    onPress={() => handleSelectQuestion(q, idx)}
                  >
                    <Text style={styles.questionNum}>Q{idx + 1}</Text>
                    <Text style={styles.questionPreview} numberOfLines={2}>{q.question}</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setSelectedQuestion(null)}>
                  <Text style={styles.backLink}>← Back to Questions</Text>
                </TouchableOpacity>
                <Text style={styles.panelTitle}>Question</Text>
                <View style={styles.questionCard}>
                  <Text style={styles.questionText}>{selectedQuestion.question}</Text>
                </View>
                <Text style={styles.panelTitle}>Select Answer</Text>
                {Object.entries(selectedQuestion.options).map(([key, value]) => {
                  const isSelected = selectedAnswer === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.answerOption, isSelected && styles.answerOptionSelected]}
                      onPress={() => setSelectedAnswer(key)}
                    >
                      <View style={[styles.answerLetter, isSelected && styles.answerLetterSelected]}>
                        <Text style={styles.answerLetterText}>{key.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.answerText, isSelected && styles.answerTextSelected]}>
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.actionBtn, !selectedAnswer && styles.actionBtnDisabled]}
                  onPress={handleAnswerQuestion}
                  disabled={!selectedAnswer}
                >
                  <Text style={styles.actionBtnText}>Submit Answer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {adminTab === 'reset' && (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>⚠️ Reset All Progress</Text>
            <Text style={styles.panelDesc}>
              This will permanently delete all stamps, quiz attempts, and redemption history.
              This action cannot be undone.
            </Text>
            <View style={styles.resetStats}>
              <View style={styles.resetStat}>
                <Text style={styles.resetStatNum}>{stampCount}</Text>
                <Text style={styles.resetStatLabel}>Stamps</Text>
              </View>
              <View style={styles.resetStat}>
                <Text style={styles.resetStatNum}>{redemptions}</Text>
                <Text style={styles.resetStatLabel}>Redemptions</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetAll}>
              <Text style={styles.resetBtnText}>🗑 Reset Everything</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Event participation stats</Text>
          </View>
          <TouchableOpacity style={styles.adminBtn} onPress={handleOpenAdmin}>
            <Text style={styles.adminBtnText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨</Text>
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
        onRequestClose={handleCloseAdmin}
      >
        <View style={[styles.modalOverlay, isAuthenticated && styles.modalOverlayFull]}>
          <View style={[styles.modal, isAuthenticated && styles.modalFull]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👤 Admin Panel</Text>
              <TouchableOpacity onPress={handleCloseAdmin}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {!isAuthenticated ? renderPasswordScreen() : renderAdminContent()}
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
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
  modalOverlayFull: {
    padding: 0,
    backgroundColor: '#f5f5f5',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
  },
  modalFull: {
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: 0,
    flex: 1,
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
  // Password screen
  passwordScreen: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  passwordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  passwordSub: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  passwordInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  passwordInputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  passwordError: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 12,
  },
  passwordBtn: {
    width: '100%',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  passwordBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Admin tabs
  adminContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3498db',
  },
  tabContent: {
    flex: 1,
  },
  tabPanel: {
    paddingBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  panelDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  numberInput: {
    width: 70,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  inputLabel: {
    fontSize: 16,
    color: '#888',
    marginLeft: 10,
  },
  actionBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionBtnDisabled: {
    backgroundColor: '#ccc',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  // Stamp rows
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stampDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  stampDotGreen: {
    backgroundColor: '#27ae60',
  },
  stampName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  stampStatus: {
    fontSize: 12,
    color: '#888',
  },
  stampStatusGreen: {
    color: '#27ae60',
    fontWeight: '600',
  },
  // Quiz
  boothQuizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  boothQuizLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  boothQuizId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    width: 40,
  },
  boothQuizName: {
    fontSize: 14,
    color: '#333',
  },
  boothQuizRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeGreen: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  badgeRed: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  attemptsText: {
    fontSize: 12,
    color: '#888',
  },
  backLink: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  questionNum: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3498db',
    width: 30,
  },
  questionPreview: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  questionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    lineHeight: 22,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  answerOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  answerLetterSelected: {
    backgroundColor: '#3498db',
  },
  answerLetterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  answerTextSelected: {
    fontWeight: '600',
    color: '#1565c0',
  },
  // Reset
  resetStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
    marginTop: 8,
  },
  resetStat: {
    alignItems: 'center',
  },
  resetStatNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  resetStatLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  resetBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Dashboard
  dashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashUpdated: {
    fontSize: 11,
    color: '#888',
  },
  dashLoading: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  dashGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  dashCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dashCardNum: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dashCardLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  dashSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dashSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  dashBigNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
  },
  dashSectionSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  dashEmpty: {
    fontSize: 13,
    color: '#aaa',
    fontStyle: 'italic',
  },
  dashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dashRank: {
    width: 28,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
  },
  dashRowText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  dashRowCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3498db',
  },
  dashExportBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  dashExportText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
