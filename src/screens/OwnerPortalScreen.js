import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import { getRentersByCustomer, getRentByRenter } from '../data/propertyStore';
import { logout, getCurrentUser } from '../navigation/AppNavigator';

const STATUS_CFG = {
  paid:    { color: theme.colors.success, bg: '#ecfdf5', label: '✅ Paid' },
  due:     { color: '#d97706',            bg: '#fffbeb', label: '⏳ Due' },
  overdue: { color: theme.colors.danger,  bg: '#fef2f2', label: '🚨 Overdue' },
};

export default function OwnerPortalScreen() {
  const user = getCurrentUser();
  const customerId = user?.customerId;

  const [renters, setRenters]       = useState([]);
  const [latestRent, setLatestRent] = useState({});
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!customerId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    getRentersByCustomer(customerId)
      .then(async (rs) => {
        if (!active) return;
        setRenters(rs);
        const entries = await Promise.all(
          rs.map(async r => [r.id, (await getRentByRenter(r.id))[0] || null])
        );
        if (active) setLatestRent(Object.fromEntries(entries));
      })
      .catch(e => console.error('[OwnerPortalScreen] load failed:', e))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [customerId]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome, {user?.name || 'Owner'}</Text>
          <Text style={styles.headerSub}>Property Owner Portal</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Tenants</Text>

        {loading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {!loading && renters.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tenants on your properties yet.</Text>
            <Text style={styles.emptySub}>Your property manager will add tenants here as they move in.</Text>
          </View>
        )}

        {renters.map(r => {
          const latest = latestRent[r.id];
          const cfg = latest ? (STATUS_CFG[latest.status] || STATUS_CFG.due) : null;
          return (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenantName}>{r.name}</Text>
                  <Text style={styles.tenantMeta}>{r.propertyName}{r.unit ? ` • Unit ${r.unit}` : ''}</Text>
                </View>
                {cfg && (
                  <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Monthly Rent</Text>
                <Text style={styles.cardValue}>₹{(r.rentAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
              {latest && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Latest Record</Text>
                  <Text style={styles.cardValue}>{latest.month}</Text>
                </View>
              )}
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Contact</Text>
                <Text style={styles.cardValue}>{r.mobile}</Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: theme.colors.primary, paddingTop: 54, paddingBottom: 20,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#a0c0e0', fontSize: 13, marginTop: 2 },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  body: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: theme.colors.textLight, textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tenantName: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  tenantMeta: { fontSize: 13, color: theme.colors.textLight, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  cardLabel: { fontSize: 13, color: theme.colors.textLight },
  cardValue: { fontSize: 13, color: theme.colors.text, fontWeight: '700' },
});
