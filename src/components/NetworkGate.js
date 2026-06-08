import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';

const ADMIN_PASSWORD = 'pbl5**';
const ALLOWED_IP = '101.78.190.2';

async function getPublicIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { timeout: 5000 });
    const data = await res.json();
    return data.ip;
  } catch (e) {
    return null;
  }
}

export default function NetworkGate({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'blocked'
  const [detectedIP, setDetectedIP] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const checkNetwork = useCallback(async () => {
    setStatus('checking');
    setPasswordError(false);

    // Basic offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('blocked');
      return;
    }

    // Fetch public IP and check against allowed IP
    const ip = await getPublicIP();
    setDetectedIP(ip);

    if (ip === ALLOWED_IP) {
      setStatus('allowed');
      return;
    }

    setStatus('blocked');
  }, []);

  useEffect(() => {
    checkNetwork();
  }, [checkNetwork]);

  const handleAdminUnlock = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setStatus('allowed');
      setShowAdmin(false);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  if (status === 'allowed') {
    return children;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.title}>Network Required</Text>
        <Text style={styles.message}>
          Please connect to the school WiFi to use this app.
        </Text>

        {status === 'checking' && (
          <View style={styles.checkingRow}>
            <ActivityIndicator color="#3498db" />
            <Text style={styles.checkingText}>Checking your network...</Text>
          </View>
        )}

        {status === 'blocked' && (
          <>
            <View style={styles.ipBox}>
              <Text style={styles.ipLabel}>Your IP:</Text>
              <Text style={styles.ipValue}>{detectedIP || 'Unknown'}</Text>
              <Text style={styles.ipExpected}>Required: {ALLOWED_IP}</Text>
            </View>

            <TouchableOpacity style={styles.checkBtn} onPress={checkNetwork}>
              <Text style={styles.checkBtnText}>Check Again</Text>
            </TouchableOpacity>

            {!showAdmin ? (
              <TouchableOpacity
                style={styles.adminLink}
                onPress={() => { setShowAdmin(true); setPasswordInput(''); setPasswordError(false); }}
              >
                <Text style={styles.adminLinkText}>Admin Override</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.adminBox}>
                <TextInput
                  style={[styles.adminInput, passwordError && styles.adminInputError]}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  placeholder="Admin password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  onSubmitEditing={handleAdminUnlock}
                  autoFocus
                />
                {passwordError && (
                  <Text style={styles.adminError}>Incorrect password</Text>
                )}
                <TouchableOpacity style={styles.adminBtn} onPress={handleAdminUnlock}>
                  <Text style={styles.adminBtnText}>Unlock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelLink}
                  onPress={() => setShowAdmin(false)}
                >
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  ipBox: {
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  ipLabel: {
    fontSize: 13,
    color: '#888',
  },
  ipValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 4,
  },
  ipExpected: {
    fontSize: 13,
    color: '#27ae60',
    marginTop: 4,
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  checkingText: {
    fontSize: 14,
    color: '#888',
  },
  checkBtn: {
    marginTop: 24,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  checkBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  adminLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  adminLinkText: {
    fontSize: 13,
    color: '#888',
    textDecorationLine: 'underline',
  },
  adminBox: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  adminInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  adminInputError: {
    borderColor: '#e74c3c',
  },
  adminError: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 6,
  },
  adminBtn: {
    marginTop: 12,
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  adminBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelLink: {
    marginTop: 10,
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 13,
    color: '#888',
  },
});
