import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { setMobileApiBaseUrl, getMobileApiBaseUrl } from '../config/api';

interface LoginScreenProps {
  onLoginSuccess: (
    user: { name: string; email: string; role: string },
    token: string | null
  ) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // 'select' = role selection screen, 'staff' = staff passcode screen
  const [screen, setScreen] = useState<'select' | 'staff'>('select');
  const [staffPasscode, setStaffPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [staffRole, setStaffRole] = useState<'staff' | 'admin'>('staff');

  const handleStudentLogin = () => {
    onLoginSuccess(
      {
        name: 'Campus Student',
        email: 'student@college.edu',
        role: 'student',
      },
      null
    );
  };

  const handleStaffLogin = () => {
    const code = staffPasscode.trim();
    if (!code) {
      setPasscodeError('Please enter your staff passcode');
      return;
    }

    // Staff passcode check
    if (
      code === 'CANTEEN2026' ||
      code === 'STAFF2026' ||
      code.toLowerCase() === 'staff' ||
      code.toLowerCase() === 'official'
    ) {
      onLoginSuccess(
        {
          name: 'Canteen Staff',
          email: 'official.canteen@campus-canteen.edu',
          role: 'staff',
        },
        null
      );
    }
    // Admin passcode check
    else if (
      code === 'ADMIN2026' ||
      code === 'MASTER2026' ||
      code.toLowerCase() === 'admin'
    ) {
      onLoginSuccess(
        {
          name: 'Canteen Administrator',
          email: 'admin@campus-canteen.edu',
          role: 'admin',
        },
        null
      );
    } else {
      setPasscodeError('Invalid passcode. Use CANTEEN2026 for staff or ADMIN2026 for admin.');
    }
  };

  // ─── Role Selection Screen ─────────────────────────────────────────────────
  if (screen === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
            <Text style={styles.appName}>CampusBite</Text>
            <Text style={styles.tagline}>Campus Food Ordering System</Text>
            <Text style={styles.subtitle}>
              Pre-order meals, skip queues &amp; collect with digital tokens
            </Text>
          </View>

          {/* Role Selection */}
          <Text style={styles.sectionLabel}>SELECT YOUR ROLE TO CONTINUE</Text>

          {/* Student Card */}
          <TouchableOpacity style={styles.studentCard} onPress={handleStudentLogin} activeOpacity={0.85}>
            <View style={styles.cardIconRow}>
              <View style={[styles.cardIcon, { backgroundColor: '#fff7ed' }]}>
                <Text style={styles.cardIconText}>🎓</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>INSTANT ACCESS</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Campus Student</Text>
            <Text style={styles.cardDesc}>
              Browse the menu, add items to cart, place orders and track them with digital tokens.
            </Text>
            <View style={styles.cardButton}>
              <Text style={styles.cardButtonText}>⚡ Enter as Student  →</Text>
            </View>
          </TouchableOpacity>

          {/* Staff / Admin Card */}
          <TouchableOpacity
            style={styles.staffCard}
            onPress={() => {
              setScreen('staff');
              setPasscodeError('');
              setStaffPasscode('');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.cardIconRow}>
              <View style={[styles.cardIcon, { backgroundColor: '#1c1917' }]}>
                <Text style={styles.cardIconText}>👨‍🍳</Text>
              </View>
              <View style={[styles.cardBadge, { backgroundColor: '#292524' }]}>
                <Text style={[styles.cardBadgeText, { color: '#f5f5f4' }]}>PASSCODE REQUIRED</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: '#fafaf9' }]}>Canteen Staff / Admin</Text>
            <Text style={[styles.cardDesc, { color: '#a8a29e' }]}>
              Manage orders, update menu items, view analytics and control canteen operations.
            </Text>
            <View style={[styles.cardButton, { backgroundColor: '#ea580c' }]}>
              <Text style={styles.cardButtonText}>🔐 Staff / Admin Login  →</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            CampusBite · Smart College Canteen System
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Staff Passcode Screen ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setScreen('select');
              setPasscodeError('');
              setStaffPasscode('');
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: '#1c1917' }]}>
              <Text style={styles.logoEmoji}>🔐</Text>
            </View>
            <Text style={styles.appName}>Staff Portal</Text>
            <Text style={styles.tagline}>CampusBite — Canteen Management</Text>
          </View>

          {/* Role Toggle */}
          <Text style={styles.sectionLabel}>LOGIN AS</Text>
          <View style={styles.roleToggleRow}>
            <TouchableOpacity
              style={[styles.roleToggleBtn, staffRole === 'staff' && styles.roleToggleActive]}
              onPress={() => { setStaffRole('staff'); setPasscodeError(''); }}
            >
              <Text style={[styles.roleToggleText, staffRole === 'staff' && styles.roleToggleTextActive]}>
                👨‍🍳 Canteen Staff
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleToggleBtn, staffRole === 'admin' && styles.roleToggleActive]}
              onPress={() => { setStaffRole('admin'); setPasscodeError(''); }}
            >
              <Text style={[styles.roleToggleText, staffRole === 'admin' && styles.roleToggleTextActive]}>
                🛡️ Administrator
              </Text>
            </TouchableOpacity>
          </View>

          {/* Passcode Form */}
          <View style={styles.passcodeCard}>
            <Text style={styles.passcodeLabel}>
              {staffRole === 'admin' ? 'Admin Passcode' : 'Staff Passcode'}
            </Text>
            <Text style={styles.passcodeHint}>
              {staffRole === 'admin'
                ? 'Enter the administrator master passcode'
                : 'Enter your canteen staff passcode'}
            </Text>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.passcodeInput, passcodeError ? styles.inputError : null]}
                value={staffPasscode}
                onChangeText={(text) => {
                  setStaffPasscode(text);
                  setPasscodeError('');
                }}
                placeholder={staffRole === 'admin' ? 'e.g. ADMIN2026' : 'e.g. CANTEEN2026'}
                placeholderTextColor="#a8a29e"
                autoCapitalize="characters"
                secureTextEntry={!showPasscode}
                returnKeyType="done"
                onSubmitEditing={handleStaffLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPasscode(!showPasscode)}
              >
                <Text style={styles.eyeText}>{showPasscode ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {passcodeError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {passcodeError}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.loginButton} onPress={handleStaffLogin}>
              <Text style={styles.loginButtonText}>
                {staffRole === 'admin' ? '🛡️ Login as Administrator' : '👨‍🍳 Login as Staff'}
              </Text>
            </TouchableOpacity>

            <View style={styles.defaultHintBox}>
              <Text style={styles.defaultHintTitle}>Default Passcodes:</Text>
              <Text style={styles.defaultHintText}>Staff: CANTEEN2026</Text>
              <Text style={styles.defaultHintText}>Admin: ADMIN2026</Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            Only authorized canteen personnel may access this portal.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a8a29e',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 2,
  },
  // ─── Student Card ──────────────────────────────────────────────────────────
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#fed7aa',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  // ─── Staff Card ───────────────────────────────────────────────────────────
  staffCard: {
    backgroundColor: '#1c1917',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 22,
  },
  cardBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c2410c',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1c1917',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    color: '#57534e',
    lineHeight: 18,
    marginBottom: 16,
  },
  cardButton: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  footerNote: {
    fontSize: 11,
    color: '#a8a29e',
    textAlign: 'center',
    marginTop: 8,
  },
  // ─── Staff Login Form ─────────────────────────────────────────────────────
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ea580c',
  },
  roleToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  roleToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  roleToggleActive: {
    backgroundColor: '#1c1917',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  roleToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716c',
  },
  roleToggleTextActive: {
    color: '#ffffff',
  },
  passcodeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  passcodeLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 4,
  },
  passcodeHint: {
    fontSize: 12,
    color: '#78716c',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passcodeInput: {
    flex: 1,
    backgroundColor: '#fafaf9',
    borderWidth: 1.5,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1c1917',
    fontWeight: '700',
    letterSpacing: 1,
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  eyeButton: {
    marginLeft: 10,
    padding: 4,
  },
  eyeText: {
    fontSize: 20,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#1c1917',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  defaultHintBox: {
    marginTop: 16,
    backgroundColor: '#fafaf9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  defaultHintTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#57534e',
    marginBottom: 4,
  },
  defaultHintText: {
    fontSize: 12,
    color: '#78716c',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
