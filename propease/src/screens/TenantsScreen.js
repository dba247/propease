import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { theme } from '../data/theme';
import { mockRentPayments, mockTenants } from '../data/mockData';

const statusConfig = {
  paid: { color: theme.colors.success, bg: '#ecfdf5', label: '✅ Paid', border: '#a7f3d0' },
  due: { color: '#d97706', bg: '#fffbeb', label: '⏳ Due', border: '#fde68a' },
  overdue: { color: theme.colors.danger, bg: '#fef2f2', label: '🚨 Overdue', border: '#fecaca' },
};

export default function TenantRentScreen({ route }) {
  const tenantId = route?.params?.tenantId;
  const tenant = mockTenants.find(t => t.id === tenantId);
  const myPayments = mockRentPayments.filter(p => p.tenantId === tenantId);
  const latestPayment = myPayments[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rent</Text>
        {tenant && (
          <Text style={styles.headerSub}>{tenant.unit} • {tenant.property}</Text>
        )}
      </View>

      {/* Current Rent Card */}
      {tenant && (
        <View style={styles.rentCard}>
          <Text style={styles.rentCardLabel}>Monthly Rent</Text>
          <Text style={styles.rentAmount}>₹{tenant.rent.toLocaleString('en-IN')}</Text>
          <Text style={styles.rentSub}>Due on 1st of every month</Text>
          {latestPayment && (
            <View style={[styles.statusBadge, { backgroundColor: statusConfig[latestPayment.status].bg, borderColor: statusConfig[latestPayment.status].border }]}>
              <Text style={[styles.statusText, { color: statusConfig[latestPayment.status].color }]}>
                {statusConfig[latestPayment.status].label} — {latestPayment.month}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Lease Info */}
      {tenant && (
        <View style={styles.leaseCard}>
          <Text style={styles.leaseTitle}>📋 Lease Details</Text>
          <View style={styles.leaseRow}>
            <Text style={styles.leaseLabel}>Unit</Text>
            <Text style={styles.leaseValue}>{tenant.unit}</Text>
          </View>
          <View style={styles.leaseRow}>
            <Text style={styles.leaseLabel}>Property</Text>
            <Text style={styles.leaseValue}>{tenant.property}</Text>
          </View>
          <View style={styles.leaseRow}>
            <Text style={styles.leaseLabel}>Lease Ends</Text>
            <Text style={styles.leaseValue}>{tenant.leaseEnd}</Text>
          </View>
        </View>
      )}

      {/* Payment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {myPayments.length === 0 && (
          <Text style={styles.emptyText}>No payment records found.</Text>
        )}
        {myPayments.map(p => {
          const cfg = statusConfig[p.status];
          return (
            <View key={p.id} style={[styles.paymentCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentMonth}>{p.month}</Text>
                  {p.paidOn && <Text style={styles.paymentDate}>Paid on {p.paidOn} via {p.method}</Text>}
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.paymentStatus, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
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
  rentCard: {
    backgroundColor: theme.colors.primary, margin: 16,
    borderRadius: theme.radius.xl, padding: 24, alignItems: 'center',
  },
  rentCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  rentAmount: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 6 },
  rentSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  statusBadge: {
    marginTop: 16, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  statusText: { fontSize: 13, fontWeight: '700' },
  leaseCard: {
    backgroundColor: theme.colors.card, marginHorizontal: 16, marginBottom: 8,
    borderRadius: theme.radius.lg, padding: 18, ...theme.shadow,
  },
  leaseTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
  leaseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  leaseLabel: { fontSize: 13, color: theme.colors.textSecondary },
  leaseValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
  emptyText: { color: theme.colors.textLight, fontSize: 14, textAlign: 'center', marginTop: 20 },
  paymentCard: {
    borderRadius: theme.radius.md, padding: 14, marginBottom: 10, borderWidth: 1.5,
  },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentMonth: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  paymentDate: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  paymentStatus: { fontSize: 12, fontWeight: '700', marginTop: 3 },
});