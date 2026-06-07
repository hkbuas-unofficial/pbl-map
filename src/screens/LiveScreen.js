import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const DASHBOARD_URL = 'https://us.posthog.com/embedded/hSFzBktMYyc7SGTuEgPL47AcZGeR4A';

export default function LiveScreen() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;

    // Get the actual DOM node
    let target = containerRef.current;
    if (target._reactInternalFiber?.stateNode) {
      target = target._reactInternalFiber.stateNode;
    }
    if (!target || !target.nodeType) return;

    // Clear and inject iframe
    target.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = DASHBOARD_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    target.appendChild(iframe);

    return () => {
      target.innerHTML = '';
    };
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📊 Live Dashboard</Text>
        <Text style={styles.subtitle}>View on web browser for live analytics</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Live Dashboard</Text>
        <Text style={styles.subtitle}>Real-time event analytics from PostHog</Text>
      </View>
      <View ref={containerRef} style={styles.iframeContainer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  iframeContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
