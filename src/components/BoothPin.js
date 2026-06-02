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
    transform: [{ translateX: -20 }, { translateY: -40 }],
    zIndex: 10,
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinStamped: {
    backgroundColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
