import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import { getRentRecords, markRentPaid } from '../data/propertyStore';

const tabs = ['All', 'Paid', 'Due', 'Overdue'];

const statusConfig = {
  paid: { color: theme.colors.success, bg: '#ecfdf5', label: '✅ Paid', border: '#a7f3d0' },
  due: { color: '#d97706', bg: '#fffbeb', label: '⏳ Due', border: '#fde68a' },
  overdue: { color: theme.colors.danger, bg: '#fef2f2', label: '🚨 Overdue', border: '#fecaca' },
};

export default function RentScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    getRentRecords()
      .then(setPayments)
      .catch(e => console.error('[RentScreen] getRentRecords failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const filtered = payments.filter(p =>
    activeTab === 'All' ? true : p.status === activeTab.toLowerCase()
  );

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Landing' }] }),
        },
      ]
    );
  };

  const collected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const pending = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  const markPaid = (id) => {
    Alert.alert('Mark as Paid', 'Confirm payment received?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            await markRentPaid(id, 'Manual');
            refresh();
          } catch (e) {
            console.error('[RentScreen] markRentPaid failed:', e);
            Alert.alert('Error', 'Could not mark rent as paid. Please try again.');
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rent Collection</Text>
        <Text style={styles.headerSub}>January 2025</Text>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.success }]}>
          <Text style={styles.summaryLabel}>Collected</Text>
          <Text style={styles.summaryAmount}>₹{(collected / 1000).toFixed(0)}K</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.danger }]}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryAmount}>₹{(pending / 1000).toFixed(0)}K</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryAmount}>₹{((collected + pending) / 1000).toFixed(0)}K</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payment List */}
      <View style={styles.list}>
        {loading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        {!loading && filtered.length === 0 && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary }}>No rent records yet.</Text>
          </View>
        )}
        {filtered.map(p => {
          const cfg = statusConfig[p.status];
          return (
            <View key={p.id} style={[styles.paymentCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
              <View style={styles.paymentTop}>
                <View>
                  <Text style={styles.paymentName}>{p.renterName}</Text>
                  <Text style={styles.paymentMeta}>{p.unit} • {p.month}</Text>
                </View>
                <Text style={styles.paymentAmount}>₹{(p.amount || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.paymentBottom}>
                <View style={[styles.badge, { backgroundColor: cfg.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {p.paidOn && (
                  <Text style={styles.paidInfo}>Paid {p.paidOn} via {p.method}</Text>
                )}
                {p.status !== 'paid' && (
                  <TouchableOpacity style={styles.markPaidBtn} onPress={() => markPaid(p.id)}>
                    <Text style={styles.markPaidText}>Mark Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff' },
  headerSub: { color: '#90b8d8', fontSize: 13, marginTop: 4 },
  summary: { flexDirection: 'row', padding: 16, gap: 10 },
  summaryCard: { flex: 1, borderRadius: theme.radius.md, padding: 14, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  summaryAmount: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 4 },
  tabs: { paddingHorizontal: 16, marginBottom: 12 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: theme.colors.card, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border,
  },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16 },
  paymentCard: {
    borderRadius: theme.radius.md, padding: 14, marginBottom: 10, borderWidth: 1.5,
  },
  paymentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  paymentName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  paymentMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  paymentAmount: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  paymentBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  paidInfo: { fontSize: 11, color: theme.colors.textSecondary, flex: 1 },
  markPaidBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm,
    paddingHorizontal: 14, paddingVertical: 6, marginLeft: 'auto',
  },
  markPaidText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  customerHeader: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  customerGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  customerName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  logoutIcon: { fontSize: 13, color: '#fff' },
  logoutText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});