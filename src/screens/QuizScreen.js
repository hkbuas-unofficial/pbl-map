import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { capture } from '../lib/posthog';
import { formatGroupDisplay } from '../lib/groupDisplay';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function QuizScreen({ booth, group, groupId, onClose, onFinish, appData }) {
  const { addGroupStamp, incrementAttempt, getRemainingAttempts } = appData;

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [questionHistory, setQuestionHistory] = useState([]);
  const [attemptNum, setAttemptNum] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [stampAwarded, setStampAwarded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [shakeAnim] = useState(new Animated.Value(0));

  const remaining = getRemainingAttempts(groupId);

  const pickQuestion = useCallback(() => {
    if (!group || !group.questions) return;
    const availableIndices = group.questions
      .map((_, i) => i)
      .filter(i => !questionHistory.includes(i));
    
    const pool = availableIndices.length > 0 ? availableIndices : group.questions.map((_, i) => i);
    const randomIdx = pool[Math.floor(Math.random() * pool.length)];
    
    setCurrentQuestion({ ...group.questions[randomIdx], _index: randomIdx });
    setQuestionHistory(prev => [...prev, randomIdx]);
  }, [group, questionHistory]);

  useEffect(() => {
    setSelectedOption(null);
    setResult(null);
    setQuestionHistory([]);
    setAttemptNum(1);
    setTotalAttempts(0);
    pickQuestion();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [group]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSelect = (key) => {
    if (result) return;
    setSelectedOption(key);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !currentQuestion) return;
    const isCorrect = selectedOption === currentQuestion.answer;
    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      if (!stampAwarded) {
        await addGroupStamp(groupId);
        setStampAwarded(true);
        capture('stamp_earned', { group_id: groupId, class_id: booth.booth_id, booth_name: booth.booth_name });
      }
    } else {
      const newCount = await incrementAttempt(groupId);
      setTotalAttempts(newCount);
      triggerShake();
      capture('quiz_wrong', { group_id: groupId, class_id: booth.booth_id, booth_name: booth.booth_name, attempt: newCount });
    }
  };

  const handleGoHome = () => {
    if (onFinish) {
      onFinish();
    } else {
      onClose();
    }
  };

  const handleAnswerMore = () => {
    setSelectedOption(null);
    setResult(null);
    setAttemptNum(prev => prev + 1);
    pickQuestion();
  };

  const handleNext = () => {
    const newRemaining = getRemainingAttempts(groupId);
    if (!stampAwarded && newRemaining <= 0) {
      capture('quiz_locked', { group_id: groupId, class_id: booth.booth_id, booth_name: booth.booth_name });
      handleGoHome();
      return;
    }
    // Next question
    setSelectedOption(null);
    setResult(null);
    setAttemptNum(prev => prev + 1);
    pickQuestion();
  };

  if (!currentQuestion) return null;

  const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D' };
  const optionColors = {
    a: '#e74c3c',
    b: '#3498db',
    c: '#f39c12',
    d: '#27ae60',
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.boothBadge}>
              <Text style={styles.boothBadgeText}>{booth.booth_id}</Text>
            </View>
            <Text style={styles.boothName}>{booth.booth_name}</Text>
            <View style={styles.attemptBadge}>
              <Text style={styles.attemptBadgeText}>
                {booth.booth_id} · {formatGroupDisplay(groupId)} · Attempt {attemptNum} of 5
              </Text>
            </View>
          </View>

          {/* Question Card */}
          <Animated.View
            style={[
              styles.questionCard,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>Q</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </Animated.View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {Object.entries(currentQuestion.options).map(([key, value]) => {
              const color = optionColors[key];
              let cardStyle = [styles.optionCard, { borderLeftColor: color }];
              let letterStyle = [styles.optionLetter, { backgroundColor: color }];
              let textStyle = styles.optionText;

              if (result) {
                if (key === currentQuestion.answer) {
                  cardStyle = [...cardStyle, styles.optionCorrect];
                  letterStyle = [...letterStyle, styles.optionLetterCorrect];
                } else if (key === selectedOption && key !== currentQuestion.answer) {
                  cardStyle = [...cardStyle, styles.optionWrong];
                  letterStyle = [...letterStyle, styles.optionLetterWrong];
                } else {
                  cardStyle = [...cardStyle, styles.optionDimmed];
                }
              } else if (key === selectedOption) {
                cardStyle = [...cardStyle, styles.optionSelected];
                letterStyle = [...letterStyle, styles.optionLetterSelected];
                textStyle = styles.optionTextSelected;
              }

              return (
                <TouchableOpacity
                  key={key}
                  style={cardStyle}
                  onPress={() => handleSelect(key)}
                  disabled={!!result}
                  activeOpacity={0.7}
                >
                  <View style={letterStyle}>
                    <Text style={styles.optionLetterText}>{optionLabels[key]}</Text>
                  </View>
                  <Text style={textStyle}>{value}</Text>
                  {result && key === currentQuestion.answer && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                  {result && key === selectedOption && key !== currentQuestion.answer && (
                    <Text style={styles.xMark}>✕</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Result Area */}
          {result === 'correct' && (
            <View style={styles.resultArea}>
              <View style={styles.resultIconCircle}>
                <Text style={styles.resultIcon}>🎉</Text>
              </View>
              <Text style={styles.resultTitle}>Correct!</Text>
              <Text style={styles.resultSub}>Stamp earned for {booth.booth_name} · {formatGroupDisplay(groupId)}</Text>
            </View>
          )}

          {result === 'wrong' && (
            <View style={styles.resultArea}>
              <View style={[styles.resultIconCircle, styles.resultIconWrong]}>
                <Text style={styles.resultIcon}>😅</Text>
              </View>
              <Text style={[styles.resultTitle, styles.resultTitleWrong]}>Not quite!</Text>
              {stampAwarded ? (
                <Text style={styles.resultSub}>
                  No penalty — you already earned this stamp.
                </Text>
              ) : getRemainingAttempts(groupId) > 0 ? (
                <Text style={styles.resultSub}>
                  {getRemainingAttempts(groupId)} attempt{getRemainingAttempts(groupId) !== 1 ? 's' : ''} remaining
                </Text>
              ) : (
                <Text style={[styles.resultSub, styles.resultSubLocked]}>
                  No more attempts. Booth locked.
                </Text>
              )}
            </View>
          )}

          {/* Action Button */}
          <View style={styles.actionArea}>
            {!result ? (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !selectedOption && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedOption}
              >
                <Text style={styles.submitBtnText}>Submit Answer</Text>
              </TouchableOpacity>
            ) : result === 'correct' ? (
              <View style={styles.correctActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.homeBtn]}
                  onPress={handleGoHome}
                >
                  <Text style={styles.homeBtnText}>Return to Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.moreBtn]}
                  onPress={handleAnswerMore}
                >
                  <Text style={styles.moreBtnText}>Answer More Questions</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  !stampAwarded && getRemainingAttempts(groupId) <= 0 && styles.nextBtnLocked,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.nextBtnText}>
                  {stampAwarded
                    ? 'Try Another Question'
                    : getRemainingAttempts(groupId) > 0
                    ? 'Try Another Question'
                    : 'Close'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    minHeight: SCREEN_H,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  boothBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  boothBadgeText: {
    color: '#1976d2',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  boothName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  attemptBadge: {
    backgroundColor: 'rgba(243,156,18,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  attemptBadgeText: {
    color: '#f39c12',
    fontSize: 12,
    fontWeight: '600',
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
  },
  questionNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    width: '48%',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#bbdefb',
    transform: [{ scale: 1.02 }],
  },
  optionCorrect: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#27ae60',
    borderColor: '#c8e6c9',
  },
  optionWrong: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#e74c3c',
    borderColor: '#ffcdd2',
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionLetterSelected: {
    transform: [{ scale: 1.1 }],
  },
  optionLetterCorrect: {
    backgroundColor: '#27ae60',
  },
  optionLetterWrong: {
    backgroundColor: '#e74c3c',
  },
  optionLetterText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#1565c0',
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 20,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  xMark: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  resultArea: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultIconWrong: {
    backgroundColor: '#ffebee',
  },
  resultIcon: {
    fontSize: 32,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  resultTitleWrong: {
    color: '#e74c3c',
  },
  resultSub: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  resultSubLocked: {
    color: '#e74c3c',
  },
  actionArea: {
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#b0bec5',
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  nextBtnLocked: {
    backgroundColor: '#78909c',
    shadowOpacity: 0,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  correctActions: {
    flexDirection: 'column',
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  homeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  homeBtnText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  moreBtn: {
    backgroundColor: '#27ae60',
  },
  moreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
