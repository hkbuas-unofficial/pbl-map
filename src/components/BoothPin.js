import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BoothPin({ booth, hasStamp, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.pinContainer,
        { left: `${booth.booth_x}%`, top: `${booth.booth_y}%` },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.pin, hasStamp && styles.pinStamped]}>
        <Text style={styles.pinText}>{hasStamp ? '✓' : booth.booth_id}</Text>
      </View>
      {/* Pulse ring for unvisited */}
      {!hasStamp && <View style={styles.pulseRing} />}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{booth.booth_name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -22 }, { translateY: -44 }],
    zIndex: 10,
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 2,
  },
  pinStamped: {
    backgroundColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#e74c3c',
    opacity: 0.4,
    zIndex: 1,
  },
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
