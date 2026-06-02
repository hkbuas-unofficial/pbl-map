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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  pinStamped: {
    backgroundColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  label: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
