import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Base pin size at zoom level 1 (fully zoomed in / 1:1 scale)
const BASE_PIN_SIZE = 72;
const BASE_FONT_SIZE = 22;
const BASE_LABEL_FONT = 14;

export default function BoothPin({ booth, hasStamp, onPress, scale = 1 }) {
  // scale is an inverse scale factor: smaller when zoomed in, larger when zoomed out
  // This keeps the pin visually constant on screen
  const pinSize = Math.round(BASE_PIN_SIZE * scale);
  const fontSize = Math.round(BASE_FONT_SIZE * scale);
  const labelFont = Math.round(BASE_LABEL_FONT * scale);
  const borderRadius = Math.round(pinSize / 2);
  const borderWidth = Math.max(1, Math.round(3 * scale));

  return (
    <TouchableOpacity
      style={styles.pinContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.pin,
          hasStamp && styles.pinStamped,
          {
            width: pinSize,
            height: pinSize,
            borderRadius: borderRadius,
            borderWidth: borderWidth,
          },
        ]}
      >
        <Text style={[styles.pinText, { fontSize: fontSize }]}>
          {hasStamp ? '✓' : booth.booth_id}
        </Text>
      </View>
      <View
        style={[
          styles.labelContainer,
          {
            paddingHorizontal: Math.max(4, Math.round(12 * scale)),
            paddingVertical: Math.max(2, Math.round(4 * scale)),
            borderRadius: Math.max(4, Math.round(8 * scale)),
            marginTop: Math.max(2, Math.round(6 * scale)),
          },
        ]}
      >
        <Text style={[styles.label, { fontSize: labelFont }]}>
          {booth.booth_name}
        </Text>
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
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  pinStamped: {
    backgroundColor: '#27ae60',
  },
  pinText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
  },
});
