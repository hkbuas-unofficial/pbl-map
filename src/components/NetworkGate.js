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
const EXPECTED_SSID = 'GUEST@ASCHOOL';

// Try to discover local IP addresses via WebRTC
function getLocalIPs() {
  return new Promise((resolve) => {
    if (typeof RTCPeerConnection === 'undefined') {
      resolve([]);
      return;
    }
    const ips = [];
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer()
      .then((o) => pc.setLocalDescription(o))
      .catch(() => resolve([]));

    pc.onicecandidate = (ice) => {
      if (!ice || !ice.candidate || !ice.candidate.candidate) {
        pc.close();
        resolve(ips);
        return;
      }
      const ipMatch = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/.exec(
        ice.candidate.candidate
      );
      if (ipMatch && !ips.includes(ipMatch[1])) {
        ips.push(ipMatch[1]);
      }
    };
    setTimeout(() => {
      try { pc.close(); } catch (e) {}
      resolve(ips);
    }, 1500);
  });
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

export default function NetworkGate({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'blocked'
  const [localIPs, setLocalIPs] = useState([]);
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

    // Try WebRTC local IP discovery
    const ips = await getLocalIPs();
    setLocalIPs(ips);

    // If we found any private IP, user is likely on a local network
    const hasPrivateIP = ips.some(isPrivateIP);

    if (hasPrivateIP) {
      setStatus('allowed');
      return;
    }

    // Fallback: on mobile web, WebRTC might be restricted.
    // If we have ANY local IP at all (even non-private), that's a strong signal
    // they're on a real network (not just cellular data without WiFi)
    if (ips.length > 0) {
      setStatus('allowed');
      return;
    }

    // Could not verify — show gate
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
          Please connect to the
        </Text>
        <Text style={styles.ssid}>{EXPECTED_SSID}</Text>
        <Text style={styles.message}>WiFi network to use this app.</Text>

        {status === 'checking' && (
          <View style={styles.checkingRow}>
            <ActivityIndicator color="#3498db" />
            <Text style={styles.checkingText}>Checking connection...</Text>
          </View>
        )}

        {status === 'blocked' && (
          <>
            <TouchableOpacity style={styles.checkBtn} onPress={checkNetwork}>
              <Text style={styles.checkBtnText}>Check Again</Text>
            </TouchableOpacity>

            {localIPs.length > 0 && (
              <Text style={styles.debugText}>
                Found IPs: {localIPs.join(', ')}
              </Text>
            )}

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
  ssid: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginVertical: 6,
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
  debugText: {
    marginTop: 12,
    fontSize: 11,
    color: '#aaa',
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
