import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function QuizModal({
  visible,
  booth,
  onClose,
  onAnswer,
  remainingAttempts,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [questionHistory, setQuestionHistory] = useState([]);

  const pickQuestion = useCallback(() => {
    if (!booth || !booth.questions) return;
    const available = booth.questions.filter(
      (_, idx) => !questionHistory.includes(idx)
    );
    const pool = available.length > 0 ? available : booth.questions;
    const poolIndices = available.length > 0
      ? booth.questions.map((_, i) => i).filter(i => !questionHistory.includes(i))
      : booth.questions.map((_, i) => i);
    
    const randomIdx = poolIndices[Math.floor(Math.random() * poolIndices.length)];
    setCurrentQuestion({ ...booth.questions[randomIdx], _index: randomIdx });
    setQuestionHistory(prev => [...prev, randomIdx]);
  }, [booth, questionHistory]);

  useEffect(() => {
    if (visible && booth) {
      setSelectedOption(null);
      setResult(null);
      setQuestionHistory([]);
      // Small delay to ensure state is cleared
      setTimeout(() => pickQuestion(), 50);
    }
  }, [visible, booth]);

  const handleSelect = (key) => {
    if (result) return;
    setSelectedOption(key);
  };

  const handleSubmit = () => {
    if (!selectedOption || !currentQuestion) return;
    const isCorrect = selectedOption === currentQuestion.answer;
    setResult(isCorrect ? 'correct' : 'wrong');
    onAnswer(isCorrect);
  };

  const handleNext = () => {
    if (result === 'correct') {
      onClose();
      return;
    }
    // Wrong answer - pick new question if attempts remain
    if (remainingAttempts > 1) {
      setSelectedOption(null);
      setResult(null);
      pickQuestion();
    } else {
      onClose();
    }
  };

  if (!currentQuestion) return null;

  const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D' };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.boothName}>{booth?.booth_name}</Text>
              <Text style={styles.attemptsText}>
                Attempt {6 - remainingAttempts} of 5
              </Text>
            </View>

            <View style={styles.questionBox}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            {Object.entries(currentQuestion.options).map(([key, value]) => {
              let optionStyle = styles.option;
              let textStyle = styles.optionText;

              if (result) {
                if (key === currentQuestion.answer) {
                  optionStyle = { ...optionStyle, ...styles.optionCorrect };
                  textStyle = { ...textStyle, ...styles.optionTextCorrect };
                } else if (key === selectedOption && key !== currentQuestion.answer) {
                  optionStyle = { ...optionStyle, ...styles.optionWrong };
                  textStyle = { ...textStyle, ...styles.optionTextWrong };
                } else {
                  optionStyle = { ...optionStyle, opacity: 0.6 };
                }
              } else if (key === selectedOption) {
                optionStyle = { ...optionStyle, ...styles.optionSelected };
                textStyle = { ...textStyle, color: '#fff' };
              }

              return (
                <TouchableOpacity
                  key={key}
                  style={optionStyle}
                  onPress={() => handleSelect(key)}
                  disabled={!!result}
                >
                  <Text style={styles.optionLabel}>{optionLabels[key]}</Text>
                  <Text style={textStyle}>{value}</Text>
                </TouchableOpacity>
              );
            })}

            {result === 'correct' && (
              <View style={styles.resultBoxCorrect}>
                <Text style={styles.resultIcon}>🎉</Text>
                <Text style={styles.resultText}>Correct! Stamp Earned!</Text>
              </View>
            )}

            {result === 'wrong' && (
              <View style={styles.resultBoxWrong}>
                <Text style={styles.resultIcon}>❌</Text>
                <Text style={styles.resultText}>Incorrect!</Text>
                {remainingAttempts <= 1 ? (
                  <Text style={styles.resultSubText}>
                    No more attempts. Booth locked.
                  </Text>
                ) : (
                  <Text style={styles.resultSubText}>
                    Try again with a new question.
                  </Text>
                )}
              </View>
            )}

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
            ) : (
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {result === 'correct' ? 'Awesome!' : remainingAttempts <= 1 ? 'Close' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  header: {
    marginBottom: 20,
  },
  boothName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  attemptsText: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  questionBox: {
    backgroundColor: '#f0f4f8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 26,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  optionSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  optionWrong: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#155724',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#721c24',
  },
  submitBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultBoxCorrect: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginVertical: 10,
  },
  resultBoxWrong: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    marginVertical: 10,
  },
  resultIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
});
