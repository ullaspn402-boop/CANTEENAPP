import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { setMobileApiBaseUrl, getMobileApiBaseUrl } from '../config/api';

interface LoginScreenProps {
  onLoginSuccess: (
    user: { name: string; email: string; role: string },
    token: string | null
  ) => void;
}

// Which screen we're on
type Screen = 'select' | 'student' | 'staff';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [screen, setScreen] = useState<Screen>('select');

  // Student form state
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentNameError, setStudentNameError] = useState('');

  // Staff form state
  const [staffPasscode, setStaffPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [staffRole, setStaffRole] = useState<'staff' | 'admin'>('staff');

  const resetErrors = () => {
    setStudentNameError('');
    setPasscodeError('');
  };

  // ─── Student Login ─────────────────────────────────────────────────────────
  const handleStudentLogin = () => {
    const name = studentName.trim();
    if (!name || name.length < 2) {
      setStudentNameError('Please enter your full name (at least 2 characters)');
      return;
    }

    const id = studentId.trim();
    // Build email from student ID or name
    const emailBase = id
      ? id.toLowerCase().replace(/[^a-z0-9]/g, '')
      : name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    const email = `${emailBase}@student.campus.edu`;

    onLoginSuccess(
      {
        name: name,
        email: email,
        role: 'student',
      },
      null
    );
  };

  // ─── Staff Login ───────────────────────────────────────────────────────────
  const handleStaffLogin = () => {
    const code = staffPasscode.trim();
    if (!code) {
      setPasscodeError('Please enter your staff passcode');
      return;
    }

    if (
      code === 'CANTEEN2026' ||
      code === 'STAFF2026' ||
      code.toLowerCase() === 'staff' ||
      code.toLowerCase() === 'official'
    ) {
      onLoginSuccess({ name: 'Canteen Staff', email: 'official.canteen@campus-canteen.edu', role: 'staff' }, null);
    } else if (
      code === 'ADMIN2026' ||
      code === 'MASTER2026' ||
      code.toLowerCase() === 'admin'
    ) {
      onLoginSuccess({ name: 'Canteen Administrator', email: 'admin@campus-canteen.edu', role: 'admin' }, null);
    } else {
      setPasscodeError('Invalid passcode. Contact canteen manager for the correct code.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Screen: Role Selection
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'select') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* App Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
            <Text style={styles.appName}>CampusBite</Text>
            <Text style={styles.tagline}>Campus Food Ordering System</Text>
            <Text style={styles.subtitle}>
              Pre-order meals · Skip queues · Collect with digital tokens
            </Text>
          </View>

          <Text style={styles.sectionLabel}>CHOOSE YOUR ROLE</Text>

          {/* ── Student Card ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.studentCard}
            onPress={() => { setScreen('student'); resetErrors(); }}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={[styles.cardIcon, { backgroundColor: '#fff7ed' }]}>
                <Text style={styles.cardIconEmoji}>🎓</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>STUDENT ACCESS</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Campus Student</Text>
            <Text style={styles.cardDesc}>
              Browse the menu, add to cart, place orders and track them live with digital tokens.
            </Text>
            <View style={[styles.cardBtn, { backgroundColor: '#ea580c' }]}>
              <Text style={styles.cardBtnText}>🎓 Student Login  →</Text>
            </View>
          </TouchableOpacity>

          {/* ── Staff / Admin Card ───────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.staffCard}
            onPress={() => { setScreen('staff'); resetErrors(); setStaffPasscode(''); }}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={[styles.cardIcon, { backgroundColor: '#292524' }]}>
                <Text style={styles.cardIconEmoji}>👨‍🍳</Text>
              </View>
              <View style={[styles.cardBadge, { backgroundColor: '#292524' }]}>
                <Text style={[styles.cardBadgeText, { color: '#d6d3d1' }]}>PASSCODE REQUIRED</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { color: '#fafaf9' }]}>Canteen Staff / Admin</Text>
            <Text style={[styles.cardDesc, { color: '#a8a29e' }]}>
              Manage orders, update menu, track inventory and view analytics.
            </Text>
            <View style={[styles.cardBtn, { backgroundColor: '#ea580c' }]}>
              <Text style={styles.cardBtnText}>🔐 Staff / Admin Login  →</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.footerNote}>CampusBite · Smart College Canteen System</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Screen: Student Login Form
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'student') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('select')}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.logoCircle, { backgroundColor: '#fff7ed' }]}>
                <Text style={styles.logoEmoji}>🎓</Text>
              </View>
              <Text style={styles.appName}>Student Login</Text>
              <Text style={styles.tagline}>CampusBite — Campus Food Ordering</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Enter Your Details</Text>
              <Text style={styles.formSubtitle}>
                Your name helps us personalize your order and token receipt.
              </Text>

              {/* Full Name */}
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={[styles.input, studentNameError ? styles.inputError : null]}
                value={studentName}
                onChangeText={(t) => { setStudentName(t); setStudentNameError(''); }}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#a8a29e"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {studentNameError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {studentNameError}</Text>
                </View>
              ) : null}

              {/* Student ID (optional) */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Student ID / Roll Number{' '}
                <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={studentId}
                onChangeText={setStudentId}
                placeholder="e.g. 22CS101"
                placeholderTextColor="#a8a29e"
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleStudentLogin}
              />
              <Text style={styles.fieldHint}>
                Used to identify your digital token at the counter.
              </Text>

              {/* Submit */}
              <TouchableOpacity style={styles.submitBtn} onPress={handleStudentLogin}>
                <Text style={styles.submitBtnText}>⚡ Enter Canteen Menu →</Text>
              </TouchableOpacity>

              {/* Info box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>🔒 No password needed</Text>
                <Text style={styles.infoText}>
                  Student access is name-based. Your orders are linked to your name and student ID for easy token pickup at the counter.
                </Text>
              </View>
            </View>

            <Text style={styles.footerNote}>CampusBite · Smart College Canteen System</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Screen: Staff / Admin Passcode
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('select')}>
            <Text style={styles.backBtnText}>← Back</Text>
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

          {/* Passcode Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {staffRole === 'admin' ? 'Admin Passcode' : 'Staff Passcode'}
            </Text>
            <Text style={styles.formSubtitle}>
              {staffRole === 'admin'
                ? 'Enter the administrator master passcode to access all controls.'
                : 'Enter your canteen staff passcode to manage live orders.'}
            </Text>

            <Text style={styles.fieldLabel}>Passcode *</Text>
            <View style={styles.passcodeRow}>
              <TextInput
                style={[styles.input, styles.passcodeInput, passcodeError ? styles.inputError : null]}
                value={staffPasscode}
                onChangeText={(t) => { setStaffPasscode(t); setPasscodeError(''); }}
                placeholder={staffRole === 'admin' ? 'e.g. ADMIN2026' : 'e.g. CANTEEN2026'}
                placeholderTextColor="#a8a29e"
                autoCapitalize="characters"
                secureTextEntry={!showPasscode}
                returnKeyType="done"
                onSubmitEditing={handleStaffLogin}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPasscode(!showPasscode)}>
                <Text style={styles.eyeText}>{showPasscode ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {passcodeError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {passcodeError}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.staffSubmitBtn} onPress={handleStaffLogin}>
              <Text style={styles.submitBtnText}>
                {staffRole === 'admin' ? '🛡️ Login as Administrator' : '👨‍🍳 Login as Canteen Staff'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📋 Default Passcodes</Text>
              <Text style={styles.infoText}>
                Staff: <Text style={styles.infoCode}>CANTEEN2026</Text>{'\n'}
                Admin: <Text style={styles.infoCode}>ADMIN2026</Text>
              </Text>
            </View>
          </View>

          <Text style={styles.footerNote}>Only authorized canteen personnel may access this portal.</Text>
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
    paddingBottom: 48,
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  logoEmoji: { fontSize: 34 },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    maxWidth: 290,
  },

  // ─── Section Label ────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a8a29e',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 2,
  },

  // ─── Student Card ─────────────────────────────────────────────────────────
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
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconEmoji: { fontSize: 22 },
  cardBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 9,
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
  cardBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },

  // ─── Back Button ──────────────────────────────────────────────────────────
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ea580c',
  },

  // ─── Form Card ────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#78716c',
    lineHeight: 17,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#292524',
    marginBottom: 6,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '400',
    color: '#a8a29e',
  },
  fieldHint: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 4,
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#fafaf9',
    borderWidth: 1.5,
    borderColor: '#d6d3d1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1c1917',
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },

  // ─── Passcode Input Row ───────────────────────────────────────────────────
  passcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passcodeInput: {
    flex: 1,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  eyeBtn: {
    marginLeft: 10,
    padding: 6,
  },
  eyeText: { fontSize: 20 },

  // ─── Error Box ────────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },

  // ─── Submit Buttons ───────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  staffSubmitBtn: {
    backgroundColor: '#1c1917',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ─── Info Box ─────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#292524',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#57534e',
    lineHeight: 18,
  },
  infoCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#ea580c',
    fontWeight: '700',
  },

  // ─── Role Toggle (Staff screen) ───────────────────────────────────────────
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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

  // ─── Footer ───────────────────────────────────────────────────────────────
  footerNote: {
    fontSize: 11,
    color: '#a8a29e',
    textAlign: 'center',
    marginTop: 6,
  },
});
