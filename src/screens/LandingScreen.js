import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../data/theme';
import { loginAsManager, loginAsOwner, loginAsTenant } from '../navigation/AppNavigator';
// Dev-only test scaffolding — everything under src/dev/ is stripped
// from production builds by the __DEV__ check below, so this import
// only actually runs code in local development.
import { ensureDevTestData } from '../dev/testSeed.js';

export default function LandingScreen({ navigation }) {
  const [seeding, setSeeding] = useState(null); // 'manager' | 'owner' | 'tenant' | null

  const quickTest = async (role) => {
    setSeeding(role);
    try {
      const { managerAccount, ownerAccount, tenantAccount } = await ensureDevTestData();
      if (role === 'manager') loginAsManager(managerAccount);
      if (role === 'owner')   loginAsOwner(ownerAccount);
      if (role === 'tenant')  loginAsTenant(tenantAccount);
    } catch (e) {
      console.error('[LandingScreen] quickTest failed:', e);
      Alert.alert('Test Login Failed', 'Could not reach Firestore to seed test data. Check your connection.');
    } finally {
      setSeeding(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.hero}>
        <Text style={styles.appName}>PropEase</Text>
        <Text style={styles.tagline}>Property Management</Text>
        <Text style={styles.sub}>Rent · Tenants · Maintenance · Work Orders</Text>

        {/* ── DEV-ONLY: Quick Test buttons ────────────────────────
            Automatically excluded from production builds — __DEV__
            is set to false by React Native/Expo whenever the app is
            built for release (EAS build, --no-dev, etc.), so none of
            this ever ships to real users. Safe to leave in place. ── */}
        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>🧪 QUICK TEST (dev build only)</Text>
            <View style={styles.devRow}>
              <TouchableOpacity style={styles.devBtn} onPress={() => quickTest('manager')} disabled={!!seeding}>
                {seeding === 'manager' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.devBtnText}>Test: Manager</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.devBtn} onPress={() => quickTest('owner')} disabled={!!seeding}>
                {seeding === 'owner' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.devBtnText}>Test: Owner</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.devBtn} onPress={() => quickTest('tenant')} disabled={!!seeding}>
                {seeding === 'tenant' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.devBtnText}>Test: Tenant</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Login', { role: 'owner' })}>
          <Text style={styles.btnPrimaryText}>Property Owner Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login', { role: 'tenant' })}>
          <Text style={styles.btnSecondaryText}>Tenant Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTertiary} onPress={() => navigation.navigate('ManagerLogin')}>
          <Text style={styles.btnTertiaryText}>Property Management Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  appName: { fontSize: 52, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  tagline: { fontSize: 20, fontWeight: '700', color: theme.colors.accentLight, marginTop: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 12, textAlign: 'center' },
  actions: { paddingHorizontal: 32, paddingBottom: 24, gap: 12 },
  btnPrimary: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg, paddingVertical: 16, alignItems: 'center',
  },
  btnPrimaryText: { color: theme.colors.primary, fontWeight: '800', fontSize: 16 },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.radius.lg, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  btnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnTertiary: {
    borderRadius: theme.radius.lg, paddingVertical: 14, alignItems: 'center',
  },
  btnTertiaryText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 14 },
  devBox: {
    marginTop: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed',
    borderRadius: theme.radius.md, padding: 12, width: '100%',
  },
  devLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  devRow: { flexDirection: 'row', gap: 8 },
  devBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center', minHeight: 36,
  },
  devBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});