import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { getMobileApiBaseUrl, setMobileApiBaseUrl } from '../config/api';

interface ProfileScreenProps {
  user: { name: string; email: string; role: string } | null;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout }) => {
  const [apiUrl, setApiUrl] = useState(getMobileApiBaseUrl());
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const handleSaveApiUrl = () => {
    setMobileApiBaseUrl(apiUrl);
    setIsEditingUrl(false);
    Alert.alert('Server Configuration Updated', `API endpoint set to:\n${apiUrl}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || 'S'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Rahul Sharma'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'student@campus.edu'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'admin'
              ? 'CANTEEN ADMINISTRATOR'
              : user?.role === 'staff'
              ? 'CANTEEN STAFF'
              : 'CAMPUS STUDENT'}
          </Text>
        </View>
      </View>

      {/* Backend API Configuration */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Shared Backend Connection</Text>
        <Text style={styles.sectionDesc}>
          Communicating with PostgreSQL & Express API
        </Text>

        {isEditingUrl ? (
          <View style={styles.urlEditor}>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="e.g. https://your-canteen-api.com"
              autoCapitalize="none"
            />
            <View style={styles.editorButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditingUrl(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveApiUrl}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.urlRow}>
            <Text style={styles.urlText} numberOfLines={1}>
              {getMobileApiBaseUrl()}
            </Text>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setIsEditingUrl(true)}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Campus Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Canteen Pickup Guidelines</Text>
        <Text style={styles.guidelineText}>• Place orders 5-10 minutes prior to pickup.</Text>
        <Text style={styles.guidelineText}>• Arrive at Counter 1 when token shows READY.</Text>
        <Text style={styles.guidelineText}>• Pay at counter with UPI, card, or cash.</Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ea580c',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
  },
  userEmail: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#57534e',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  sectionDesc: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
    marginBottom: 10,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafaf9',
    padding: 10,
    borderRadius: 10,
  },
  urlText: {
    fontSize: 11,
    color: '#292524',
    flex: 1,
    marginRight: 8,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ffedd5',
    borderRadius: 6,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c2410c',
  },
  urlEditor: {
    gap: 8,
  },
  input: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
  },
  editorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f5f5f4',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#57534e',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#ea580c',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  guidelineText: {
    fontSize: 12,
    color: '#57534e',
    marginVertical: 2,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
