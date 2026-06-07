import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useAppData } from './src/hooks/useAppData';
import { startSession, endSession } from './src/lib/tracking';

import MapScreen from './src/screens/MapScreen';
import ScanScreen from './src/screens/ScanScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NetworkGate from './src/components/NetworkGate';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.iconBox, focused && styles.iconBoxFocused]}>
      <Text style={styles.iconText}>{emoji}</Text>
    </View>
  );
}

export default function App() {
  const appData = useAppData();

  // Real-time session tracking (no heartbeat to save D1 writes)
  useEffect(() => {
    if (!appData.deviceId || Platform.OS !== 'web') return;

    const id = appData.deviceId;
    startSession(id);

    const handleUnload = () => {
      endSession(id);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        endSession(id);
      } else if (document.visibilityState === 'visible') {
        startSession(id);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      endSession(id);
    };
  }, [appData.deviceId]);

  if (appData.loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NetworkGate>
      <NavigationContainer>
        <Tab.Navigator
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
            {() => <ScanScreen appData={appData} />}
          </Tab.Screen>
          <Tab.Screen
            name="My Stamps"
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} />,
              tabBarBadge: appData.getStampCount() > 0 ? appData.getStampCount() : undefined,
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
    </NetworkGate>
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
});
