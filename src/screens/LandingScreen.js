import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { theme } from '../data/theme';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.hero}>
        <Text style={styles.appName}>PropEase</Text>
        <Text style={styles.tagline}>Property Management</Text>
        <Text style={styles.sub}>Rent · Tenants · Maintenance · Work Orders</Text>
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
});