import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BoothPin({ booth, hasStamp, onPress }) {
  return (
    <TouchableOpacity
      style={styles.pinContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.pin, hasStamp && styles.pinStamped]}>
        <Text style={styles.pinText}>{hasStamp ? '✓' : booth.booth_id}</Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{booth.booth_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  pin: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  pinStamped: {
    backgroundColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
  },
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
});
