import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_BOOTHS } from '../data/demoBooths';

const STORAGE_KEYS = {
  STAMPS: '@pbl_stamps',
  ATTEMPTS: '@pbl_attempts',
  REDEMPTIONS: '@pbl_redemptions',
  DEVICE_ID: '@pbl_device_id',
};

// Stamp requirements
export const REDEMPTION_THRESHOLD = 3; // stamps needed to redeem
export const REDEMPTION_COST = 3; // stamps deducted per redemption
export const MAX_ATTEMPTS_PER_BOOTH = 5;

export function useAppData() {
  const [stamps, setStamps] = useState({}); // { booth_id: true }
  const [attempts, setAttempts] = useState({}); // { booth_id: count }
  const [redemptions, setRedemptions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [booths] = useState(DEMO_BOOTHS);
  const [deviceId, setDeviceId] = useState(null);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stampsJson, attemptsJson, redemptionsJson, deviceIdStored] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.STAMPS),
        AsyncStorage.getItem(STORAGE_KEYS.ATTEMPTS),
        AsyncStorage.getItem(STORAGE_KEYS.REDEMPTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID),
      ]);
      setStamps(stampsJson ? JSON.parse(stampsJson) : {});
      setAttempts(attemptsJson ? JSON.parse(attemptsJson) : {});
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

  const saveRedemptions = async (count) => {
    setRedemptions(count);
    await AsyncStorage.setItem(STORAGE_KEYS.REDEMPTIONS, count.toString());
  };

  // Stamp operations
  const hasStamp = useCallback((boothId) => !!stamps[boothId], [stamps]);
  const getStampCount = useCallback(() => Object.keys(stamps).length, [stamps]);

  const addStamp = async (boothId) => {
    const newStamps = { ...stamps, [boothId]: true };
    await saveStamps(newStamps);
  };

  // Attempt operations
  const getAttemptCount = useCallback((boothId) => attempts[boothId] || 0, [attempts]);

  const incrementAttempt = async (boothId) => {
    const newAttempts = { ...attempts, [boothId]: (attempts[boothId] || 0) + 1 };
    await saveAttempts(newAttempts);
    return newAttempts[boothId];
  };

  const isLockedOut = useCallback((boothId) => {
    return (attempts[boothId] || 0) >= MAX_ATTEMPTS_PER_BOOTH && !stamps[boothId];
  }, [attempts, stamps]);

  const canAttempt = useCallback((boothId) => {
    return !hasStamp(boothId) && !isLockedOut(boothId);
  }, [hasStamp, isLockedOut]);

  const getRemainingAttempts = useCallback((boothId) => {
    if (hasStamp(boothId)) return 0;
    return MAX_ATTEMPTS_PER_BOOTH - (attempts[boothId] || 0);
  }, [attempts, hasStamp]);

  // Redemption
  const canRedeem = useCallback(() => {
    return getStampCount() >= REDEMPTION_THRESHOLD;
  }, [getStampCount]);

  const redeemSouvenir = async () => {
    if (!canRedeem()) return false;
    // Deduct stamps - we keep the stamp count but track redemptions separately
    // Actually, let's deduct by removing stamps (FIFO)
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
    setRedemptions(0);
  };

  // Get a random question for a booth
  const getRandomQuestion = useCallback((boothId) => {
    const booth = booths.find(b => b.booth_id === boothId);
    if (!booth || !booth.questions || booth.questions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * booth.questions.length);
    return booth.questions[randomIndex];
  }, [booths]);

  return {
    booths,
    stamps,
    attempts,
    redemptions,
    loading,
    hasStamp,
    getStampCount,
    addStamp,
    getAttemptCount,
    incrementAttempt,
    isLockedOut,
    canAttempt,
    getRemainingAttempts,
    canRedeem,
    redeemSouvenir,
    getRandomQuestion,
    resetAll,
    loadData,
    saveStamps,
    saveAttempts,
    deviceId,
  };
}
