import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_BOOTHS } from '../data/demoBooths';
import { GROUP_QUESTIONS } from '../data/groupQuestions';

const STORAGE_KEYS = {
  STAMPS: '@pbl_stamps',
  ATTEMPTS: '@pbl_attempts',
  REDEMPTIONS: '@pbl_redemptions',
  DEVICE_ID: '@pbl_device_id',
  COMPLETED: '@pbl_completed', // tracks groups completed (not redeemed)
};

// Stamp requirements
export const REDEMPTION_THRESHOLD = 5; // stamps needed to redeem
export const REDEMPTION_COST = 5; // stamps deducted per redemption
export const MAX_ATTEMPTS_PER_GROUP = 5;

export function useAppData() {
  const [stamps, setStamps] = useState({}); // { group_id: true } — current redeemable stamps
  const [attempts, setAttempts] = useState({}); // { group_id: count }
  const [completed, setCompleted] = useState({}); // { group_id: true } — permanently completed (for progress)
  const [redemptions, setRedemptions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booths] = useState(DEMO_BOOTHS); // grade pins
  const [deviceId, setDeviceId] = useState(null);

  const allGroupIds = useCallback(() => Object.keys(GROUP_QUESTIONS), []);

  const findGroup = useCallback((groupId) => {
    return GROUP_QUESTIONS[groupId] || null;
  }, []);

  const getGradeGroupIds = useCallback((gradeId) => {
    return Object.values(GROUP_QUESTIONS)
      .filter(g => g.grade === gradeId)
      .map(g => g.groupId);
  }, []);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stampsJson, attemptsJson, redemptionsJson, completedJson, deviceIdStored] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.STAMPS),
        AsyncStorage.getItem(STORAGE_KEYS.ATTEMPTS),
        AsyncStorage.getItem(STORAGE_KEYS.REDEMPTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
      ]);
      setStamps(stampsJson ? JSON.parse(stampsJson) : {});
      setAttempts(attemptsJson ? JSON.parse(attemptsJson) : {});
      setCompleted(completedJson ? JSON.parse(completedJson) : {});
      setRedemptions(redemptionsJson ? parseInt(redemptionsJson, 10) : 0);

      let id = deviceIdStored;
      if (!id) {
        id = 'pbl_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
      }
      setDeviceId(id);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveStamps = async (newStamps) => {
    setStamps(newStamps);
    await AsyncStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(newStamps));
  };

  const saveAttempts = async (newAttempts) => {
    setAttempts(newAttempts);
    await AsyncStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(newAttempts));
  };

  const saveCompleted = async (newCompleted) => {
    setCompleted(newCompleted);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(newCompleted));
  };

  const saveRedemptions = async (count) => {
    setRedemptions(count);
    await AsyncStorage.setItem(STORAGE_KEYS.REDEMPTIONS, count.toString());
  };

  // Group stamp operations
  const hasGroupStamp = useCallback((groupId) => !!stamps[groupId], [stamps]);
  const getStampCount = useCallback(() => Object.keys(stamps).length, [stamps]);

  const addGroupStamp = async (groupId) => {
    const newStamps = { ...stamps, [groupId]: true };
    const newCompleted = { ...completed, [groupId]: true };
    await saveStamps(newStamps);
    await saveCompleted(newCompleted);
  };

  // Grade completion: tick when ANY group in the grade is stamped (for pin display)
  const isClassComplete = useCallback((gradeId) => {
    const groupIds = getGradeGroupIds(gradeId);
    return groupIds.some(id => completed[id]); // use completed, not stamps
  }, [getGradeGroupIds, completed]);

  const getClassProgress = useCallback((gradeId) => {
    const groupIds = getGradeGroupIds(gradeId);
    const stamped = groupIds.filter(id => completed[id]).length; // use completed, not stamps
    return { total: groupIds.length, stamped };
  }, [getGradeGroupIds, completed]);

  // Backwards-compatible wrappers
  const hasStamp = useCallback((boothId) => isClassComplete(boothId), [isClassComplete]);
  const addStamp = async (groupId) => addGroupStamp(groupId);

  // Attempt operations (per group)
  const getAttemptCount = useCallback((groupId) => attempts[groupId] || 0, [attempts]);

  const incrementAttempt = async (groupId) => {
    const newAttempts = { ...attempts, [groupId]: (attempts[groupId] || 0) + 1 };
    await saveAttempts(newAttempts);
    return newAttempts[groupId];
  };

  const isLockedOut = useCallback((groupId) => {
    return (attempts[groupId] || 0) >= MAX_ATTEMPTS_PER_GROUP && !stamps[groupId];
  }, [attempts, stamps]);

  const canAttempt = useCallback((groupId) => {
    return !hasGroupStamp(groupId) && !isLockedOut(groupId);
  }, [hasGroupStamp, isLockedOut]);

  const getRemainingAttempts = useCallback((groupId) => {
    if (hasGroupStamp(groupId)) return 0;
    return MAX_ATTEMPTS_PER_GROUP - (attempts[groupId] || 0);
  }, [attempts, hasGroupStamp]);

  // Redemption
  const canRedeem = useCallback(() => {
    return getStampCount() >= REDEMPTION_THRESHOLD;
  }, [getStampCount]);

  const redeemSouvenir = async () => {
    if (!canRedeem()) return false;
    const stampIds = Object.keys(stamps);
    const toRemove = stampIds.slice(0, REDEMPTION_COST);
    const newStamps = { ...stamps };
    toRemove.forEach(id => delete newStamps[id]);
    await saveStamps(newStamps);
    await saveRedemptions(redemptions + 1);
    return true;
  };

  // Reset all data (for testing)
  const resetAll = async () => {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    setStamps({});
    setAttempts({});
    setCompleted({});
    setRedemptions(0);
  };

  // Get a random question for a group
  const getRandomQuestion = useCallback((groupId) => {
    const group = findGroup(groupId);
    if (!group || !group.questions || group.questions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * group.questions.length);
    return group.questions[randomIndex];
  }, [findGroup]);

  return {
    booths,
    stamps,
    attempts,
    completed,
    redemptions,
    loading,
    hasStamp,
    hasGroupStamp,
    isClassComplete,
    getClassProgress,
    getStampCount,
    addStamp,
    addGroupStamp,
    getAttemptCount,
    incrementAttempt,
    isLockedOut,
    canAttempt,
    getRemainingAttempts,
    canRedeem,
    redeemSouvenir,
    getRandomQuestion,
    findGroup,
    allGroupIds,
    resetAll,
    loadData,
    saveStamps,
    saveAttempts,
    saveCompleted,
    deviceId,
  };
}
