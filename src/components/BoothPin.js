import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const PIN_SIZE = 36;
const FONT_SIZE = 14;
const LABEL_FONT = 10;

export default function BoothPin({ booth, hasStamp, onPress }) {
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
        ]}
      >
        <Text style={styles.pinText}>
          {hasStamp ? '✓' : booth.booth_id}
        </Text>
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {booth.booth_name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 3,
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
    fontSize: FONT_SIZE,
    fontWeight: 'bold',
  },
  labelContainer: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  label: {
    color: '#fff',
    fontSize: LABEL_FONT,
    fontWeight: '700',
  },
});
