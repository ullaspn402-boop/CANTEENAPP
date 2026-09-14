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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CAMPUS FOOD ORDERING</Text>
        </View>

        <Text style={styles.title}>Smart College Canteen</Text>
        <Text style={styles.subtitle}>
          Pre-order campus meals, skip counter queues, and collect food with instant digital tokens.
        </Text>

        <View style={styles.actionContainer}>
          {/* Real Google OAuth Login */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIconBadge}>
                  <Text style={styles.googleIconLetter}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Instant Campus Student Access (Bypasses external web popups if needed) */}
          <TouchableOpacity
            style={styles.guestButton}
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
            <Text style={styles.guestButtonText}>⚡ Instant Campus Student Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsEditingServer(!isEditingServer)}
          >
            <Text style={styles.secondaryButtonText}>
              {isEditingServer ? 'Hide Server Settings' : 'Configure Backend URL'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditingServer && (
          <View style={styles.serverSettings}>
            <Text style={styles.serverLabel}>Backend REST API URL:</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="e.g. https://your-canteen-api.com"
              autoCapitalize="none"
            />
            <Text style={styles.serverHelp}>
              Enter the deployed HTTPS backend API URL for production, or your network server address.
            </Text>
          </View>
        )}

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Zero-Queue Campus Canteen • Powered by Shared PostgreSQL & Cloud SQL
          </Text>
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
  googleButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconLetter: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '900',
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  guestButton: {
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#ea580c',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f4',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#44403c',
    fontSize: 13,
    fontWeight: '600',
  },
  serverSettings: {
    marginTop: 18,
    padding: 12,
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  serverLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#292524',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  serverHelp: {
    fontSize: 10,
    color: '#78716c',
    marginTop: 6,
    lineHeight: 14,
  },
  footerNote: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#a8a29e',
    textAlign: 'center',
  },
});
