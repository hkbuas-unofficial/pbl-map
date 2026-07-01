import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const PIN_SIZE = 56;
const FONT_SIZE = 22;

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
          {hasStamp ? '✓' : (booth.display_id || booth.booth_id)}
        </Text>
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: '#FD919E',
    justifyContent: 'center',
    alignItems: 'center',
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

});
