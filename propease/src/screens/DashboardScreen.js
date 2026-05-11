import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { theme } from '../data/theme';
import { getCustomers, getRentRecords, getMaintenanceRequests, getWorkOrders } from '../data/propertyStore';
import { getCurrentUser } from '../navigation/AppNavigator';
import { Auth } from '../../App';

export default function DashboardScreen({ navigation }) {
  const [tick, setTick] = React.useState(0);
  useFocusEffect(useCallback(() => { setTick(t => t + 1); }, []));

  const user         = getCurrentUser();
  const userName     = user?.name || 'Manager';
  const userInitials = userName !== 'Manager'
    ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '👤';

  const customers   = getCustomers();
  const rentRecords = getRentRecords();
  const maintenance = getMaintenanceRequests();
  const workOrders  = getWorkOrders();

  const collected = rentRecords.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const pending   = rentRecords.filter(r => r.status !== 'paid').reduce((s, r) => s + r.amount, 0);
  const overdue   = rentRecords.filter(r => r.status === 'overdue');
  const openWO    = workOrders.filter(w => w.status === 'open' || w.status === 'in-progress');

  const doLogout = () => { if (Auth.logout) Auth.logout(); };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Management Portal</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>⏻ Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.summaryLabel}>Collected</Text>
          <Text style={styles.summaryAmount}>₹{collected.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.danger }]}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryAmount}>₹{pending.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { icon: '👥', label: 'Customers',   value: customers.length },
          { icon: '💰', label: 'Rent Due',    value: rentRecords.filter(r => r.status !== 'paid').length },
          { icon: '📋', label: 'Work Orders', value: openWO.length },
          { icon: '🚨', label: 'Overdue',     value: overdue.length },
        ].map(s => (
          <View style={styles.statCard} key={s.label}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'Customers',   icon: '👥', screen: 'Customers' },
            { label: 'Rent',        icon: '💰', screen: 'Rent' },
            { label: 'Work Orders', icon: '📋', screen: 'Work Orders' },
            { label: 'Contact',     icon: '📞', screen: 'Contact' },
          ].map(a => (
            <TouchableOpacity style={styles.actionBtn} key={a.label} onPress={() => navigation.navigate(a.screen)}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {overdue.length > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>🚨 Overdue Rent</Text>
          {overdue.map(r => (
            <View style={styles.alertRow} key={r.id}>
              <Text style={styles.alertName}>{r.renterName || r.customerName} — {r.unit}</Text>
              <Text style={styles.alertAmount}>₹{(r.amount || 0).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('Rent')}>
            <Text style={styles.alertLink}>View Rent →</Text>
          </TouchableOpacity>
        </View>
      )}

      {customers.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>No customers yet</Text>
          <Text style={styles.emptyDesc}>Add your first customer to get started.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Customers')}>
            <Text style={styles.emptyBtnText}>Go to Customers →</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { color: '#90b8d8', fontSize: 13 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  headerRight: { alignItems: 'center', gap: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  summaryRow: { flexDirection: 'row', padding: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: theme.radius.lg, padding: 18 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  summaryAmount: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  statCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 12, alignItems: 'center', ...theme.shadow },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: theme.colors.primary },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '47%', backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 16, alignItems: 'center', ...theme.shadow },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
  alertCard: { backgroundColor: '#fef2f2', margin: 16, borderRadius: theme.radius.md, padding: 16, borderWidth: 1, borderColor: '#fecaca' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#b91c1c', marginBottom: 10 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  alertName: { fontSize: 13, color: '#7f1d1d' },
  alertAmount: { fontSize: 13, fontWeight: '700', color: '#b91c1c' },
  alertLink: { color: theme.colors.primary, fontWeight: '700', fontSize: 13, marginTop: 8 },
  emptyCard: { margin: 24, backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: 32, alignItems: 'center', ...theme.shadow },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  emptyDesc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' },
  emptyBtn: { marginTop: 20, backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, paddingVertical: 13, paddingHorizontal: 28 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});