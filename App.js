import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { useAppData } from './src/hooks/useAppData';
import { initPostHog } from './src/lib/posthog';
import { extractBoothId } from './src/lib/qrParser';

import MapScreen from './src/screens/MapScreen';
import ScanScreen from './src/screens/ScanScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.iconBox, focused && styles.iconBoxFocused]}>
      <Text style={styles.iconText}>{emoji}</Text>
    </View>
  );
}

function StampTabIcon({ emoji, focused, showNotification }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showNotification) {
      shakeAnim.setValue(0);
      return;
    }

    // Continuous wiggle/shake animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
      shakeAnim.setValue(0);
    };
  }, [showNotification]);

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <Animated.View style={[styles.iconBox, focused && styles.iconBoxFocused, { transform: [{ rotate }] }]}>
      <Text style={styles.iconText}>{emoji}</Text>
      {showNotification && (
        <View style={styles.notificationDot} />
      )}
    </Animated.View>
  );
}

export default function App() {
  const appData = useAppData();
  const [initialBoothId, setInitialBoothId] = useState(null);

  // Initialize PostHog analytics on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
      // Check if opened via deep link with booth ID
      if (typeof window !== 'undefined' && window.location.href) {
        const boothId = extractBoothId(window.location.href);
        if (boothId) {
          setInitialBoothId(boothId);
        }
      }
    }
  }, []);

  if (appData.loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
        <Tab.Navigator
          initialRouteName={initialBoothId ? 'Scan' : 'Map'}
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: true,
            tabBarLabelStyle: styles.tabLabel,
            tabBarActiveTintColor: '#3498db',
            tabBarInactiveTintColor: '#888',
          }}
        >
          <Tab.Screen
            name="Map"
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
            }}
          >
            {(props) => <MapScreen {...props} appData={appData} />}
          </Tab.Screen>
          <Tab.Screen
            name="Scan"
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="📷" focused={focused} />,
            }}
          >
            {() => <ScanScreen appData={appData} initialBoothId={initialBoothId} />}
          </Tab.Screen>
          <Tab.Screen
            name="My Stamps"
            options={{
              tabBarIcon: ({ focused }) => (
                <StampTabIcon
                  emoji="🏆"
                  focused={focused}
                  showNotification={appData.canRedeem()}
                />
              ),
            }}
          >
            {() => <WalletScreen appData={appData} />}
          </Tab.Screen>
          <Tab.Screen
            name="Profile"
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
            }}
          >
            {() => <ProfileScreen appData={appData} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#888',
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
    paddingBottom: 8,
    height: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconBoxFocused: {
    backgroundColor: '#e3f2fd',
  },
  iconText: {
    fontSize: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
