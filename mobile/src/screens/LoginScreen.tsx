import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getMobileApiBaseUrl, setMobileApiBaseUrl } from '../config/api';

WebBrowser.maybeCompleteAuthSession();

// Firebase Web Config from firebase-applet-config.json
const FIREBASE_API_KEY = 'AIzaSyCFPwm9Cdx4Ohd2HAXFUxlBOGJyj2nqGso';
const GOOGLE_CLIENT_ID = '229607936562-n9bf0gf807qlf2k7vkv7d47v61423j8e.apps.googleusercontent.com';

interface LoginScreenProps {
  onLoginSuccess: (
    user: { name: string; email: string; role: string },
    token: string | null
  ) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [serverUrl, setServerUrl] = useState(getMobileApiBaseUrl());
  const [isEditingServer, setIsEditingServer] = useState(false);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      exchangeGoogleForFirebase(response);
    } else if (response?.type === 'error') {
      setLoading(false);
      Alert.alert(
        'Google Sign-In Error',
        response.error?.message || 'Failed to authenticate with Google.'
      );
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    // Save custom server URL if modified
    setMobileApiBaseUrl(serverUrl);

    try {
      await promptAsync();
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        'Sign-In Unavailable',
        err.message || 'Could not launch Google authentication.'
      );
    }
  };

  const exchangeGoogleForFirebase = async (authResponse: any) => {
    try {
      const idToken =
        authResponse.authentication?.idToken || authResponse.params?.id_token;
      const accessToken =
        authResponse.authentication?.accessToken ||
        authResponse.params?.access_token;

      if (!idToken && !accessToken) {
        throw new Error('No identity token received from Google.');
      }

      const postBodyParts: string[] = ['providerId=google.com'];
      if (idToken) {
        postBodyParts.push(`id_token=${encodeURIComponent(idToken)}`);
      }
      if (accessToken) {
        postBodyParts.push(`access_token=${encodeURIComponent(accessToken)}`);
      }

      const firebaseRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postBody: postBodyParts.join('&'),
            requestUri: 'https://smart-college-canteen-bb8a7.firebaseapp.com',
            returnIdpCredential: true,
            returnSecureToken: true,
          }),
        }
      );

      if (!firebaseRes.ok) {
        const errorData = await firebaseRes.json().catch(() => ({}));
        const message =
          errorData.error?.message ||
          `Firebase auth failed with status ${firebaseRes.status}`;
        throw new Error(message);
      }

      const firebaseData = await firebaseRes.json();
      const firebaseIdToken = firebaseData.idToken;
      const email = firebaseData.email || 'student@campus-canteen.edu';
      const displayName =
        firebaseData.displayName ||
        (email ? email.split('@')[0] : 'Campus Student');

      // Call GET /api/auth/me to obtain verified role from PostgreSQL
      const targetApiUrl = (serverUrl || getMobileApiBaseUrl()).replace(/\/+$/, '');
      const meRes = await fetch(`${targetApiUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
        },
      });

      if (!meRes.ok) {
        const errorData = await meRes.json().catch(() => ({}));
        const message =
          errorData.error ||
          errorData.message ||
          `Backend authorization check failed with status ${meRes.status}`;
        throw new Error(message);
      }

      const meData = await meRes.json();
      if (!meData?.user?.role) {
        throw new Error('Server /api/auth/me did not return an authenticated user role.');
      }

      const verifiedRole = meData.user.role;
      const verifiedName = meData.user.name || displayName;
      const verifiedEmail = meData.user.email || email;

      onLoginSuccess(
        {
          name: verifiedName,
          email: verifiedEmail,
          role: verifiedRole,
        },
        firebaseIdToken
      );
    } catch (err: any) {
      console.error('Firebase token exchange error:', err);
      Alert.alert(
        'Authentication Failed',
        err.message || 'Could not verify credentials with the campus authentication service.'
      );
    } finally {
      setLoading(false);
    }
  };

  const [isStaffMode, setIsStaffMode] = useState(false);
  const [staffPasscode, setStaffPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const handleStaffLogin = () => {
    const code = staffPasscode.trim();
    if (!code) {
      setPasscodeError('Please enter a passcode');
      return;
    }
    if (code === 'CANTEEN2026' || code === 'staff' || code.toLowerCase() === 'official') {
      onLoginSuccess(
        {
          name: 'Canteen Staff',
          email: 'official.canteen@campus-canteen.edu',
          role: 'staff',
        },
        null
      );
    } else if (code.toLowerCase() === 'admin' || code === 'MASTER2026') {
      onLoginSuccess(
        {
          name: 'Canteen Administrator',
          email: 'admin@campus-canteen.edu',
          role: 'admin',
        },
        null
      );
    } else {
      setPasscodeError('Invalid passcode. Default is CANTEEN2026');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CAMPUS FOOD ORDERING</Text>
        </View>

        <Text style={styles.title}>CampusBite</Text>
        <Text style={styles.subtitle}>
          Pre-order campus meals, skip counter queues, and collect food with instant digital tokens.
        </Text>

        <View style={styles.actionContainer}>
          {/* Primary Action: Instant Student Access */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setMobileApiBaseUrl(serverUrl);
              onLoginSuccess(
                {
                  name: 'Campus Student',
                  email: 'student@college.edu',
                  role: 'student',
                },
                null
              );
            }}
          >
            <Text style={styles.primaryButtonText}>⚡ Enter as Campus Student</Text>
          </TouchableOpacity>

          {/* Canteen Staff / Admin Login Toggle */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setIsStaffMode(!isStaffMode);
              setPasscodeError('');
            }}
          >
            <Text style={styles.secondaryButtonText}>
              {isStaffMode ? 'Close Staff Login' : '👨‍🍳 Canteen Staff / Admin Login'}
            </Text>
          </TouchableOpacity>

          {isStaffMode && (
            <View style={styles.staffSettings}>
              <Text style={styles.staffLabel}>Enter Staff Passcode:</Text>
              <TextInput
                style={styles.input}
                value={staffPasscode}
                onChangeText={(text) => {
                  setStaffPasscode(text);
                  setPasscodeError('');
                }}
                placeholder="e.g. CANTEEN2026"
                placeholderTextColor="#a8a29e"
                autoCapitalize="characters"
                secureTextEntry
              />
              {passcodeError ? (
                <Text style={styles.errorText}>{passcodeError}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.staffSubmitButton}
                onPress={handleStaffLogin}
              >
                <Text style={styles.staffSubmitButtonText}>Verify & Login as Staff</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Google Sign-In Option */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#44403c" />
            ) : (
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIconBadge}>
                  <Text style={styles.googleIconLetter}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  badge: {
    backgroundColor: '#ffedd5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#57534e',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f4',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#44403c',
    fontSize: 14,
    fontWeight: '700',
  },
  staffSettings: {
    padding: 14,
    backgroundColor: '#fafaf9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    gap: 8,
  },
  staffLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#292524',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1c1917',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  staffSubmitButton: {
    backgroundColor: '#292524',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  staffSubmitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconLetter: {
    color: '#ea580c',
    fontSize: 12,
    fontWeight: '900',
  },
  googleButtonText: {
    color: '#44403c',
    fontSize: 13,
    fontWeight: '600',
  },
});
