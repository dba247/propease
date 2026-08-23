import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, StatusBar, Modal, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import {
  getRenterById, getRentByRenter, getMaintenanceByRenter, addMaintenanceRequest,
} from '../data/propertyStore';
import { logout, getCurrentUser } from '../navigation/AppNavigator';

function ordinalSuffix(n) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

const RENT_STATUS_CFG = {
  paid:    { color: theme.colors.success, bg: '#ecfdf5', label: '✅ Paid' },
  due:     { color: '#d97706',            bg: '#fffbeb', label: '⏳ Due' },
  overdue: { color: theme.colors.danger,  bg: '#fef2f2', label: '🚨 Overdue' },
};

const MAINT_STATUS_CFG = {
  open:        { color: '#d97706',           bg: '#fffbeb', label: 'Open' },
  in_progress: { color: theme.colors.primary,bg: '#eff6ff', label: 'In Progress' },
  resolved:    { color: theme.colors.success,bg: '#ecfdf5', label: 'Resolved' },
};

function ReportIssueModal({ visible, onClose, onSubmitted, renter }) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please describe the issue briefly.');
      return;
    }
    setSaving(true);
    try {
      await addMaintenanceRequest({
        title: title.trim(),
        description: description.trim(),
        renterId: renter.id,
        renterName: renter.name,
        propertyId: renter.propertyId,
        propertyName: renter.propertyName,
        customerId: renter.customerId,
        unit: renter.unit,
      });
      setTitle('');
      setDesc('');
      onSubmitted();
      onClose();
      Alert.alert('Request Submitted', 'Your property manager has been notified.');
    } catch (e) {
      console.error('[TenantPortalScreen] addMaintenanceRequest failed:', e);
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalCard}>
          <Text style={s.modalTitle}>Report an Issue</Text>
          <Text style={s.label}>What's the issue?</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Leaking kitchen faucet"
            placeholderTextColor={theme.colors.textLight}
            value={title}
            onChangeText={setTitle}
          />
          <Text style={s.label}>Details (optional)</Text>
          <TextInput
            style={[s.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Add any extra detail that might help..."
            placeholderTextColor={theme.colors.textLight}
            value={description}
            onChangeText={setDesc}
            multiline
          />
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Request</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function TenantPortalScreen() {
  const user = getCurrentUser();
  const renterId = user?.renterId;

  const [renter, setRenter]         = useState(null);
  const [rentRecords, setRentRecords] = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showReport, setShowReport] = useState(false);

  const refresh = () => {
    if (!renterId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      getRenterById(renterId),
      getRentByRenter(renterId),
      getMaintenanceByRenter(renterId),
    ]).then(([r, rent, maint]) => {
      setRenter(r);
      setRentRecords(rent);
      setRequests(maint);
    }).catch(e => console.error('[TenantPortalScreen] load failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [renterId]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const latest = rentRecords[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome, {user?.name || 'Tenant'}</Text>
          <Text style={styles.headerSub}>{renter?.propertyName || 'Tenant Portal'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {!loading && (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

          {/* Lease info card */}
          <Text style={styles.sectionTitle}>Lease Information</Text>
          {renter && (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Property Address</Text>
                <Text style={styles.cardValue}>{renter.propertyAddress || renter.propertyName}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Monthly Rent</Text>
                <Text style={styles.cardValue}>₹{(renter.rentAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Rent Due Date</Text>
                <Text style={styles.cardValue}>{renter.rentDueDate ? `${renter.rentDueDate}${ordinalSuffix(renter.rentDueDate)} of month` : '—'}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Lease Period</Text>
                <Text style={styles.cardValue}>{renter.leaseStart} → {renter.leaseEnd}</Text>
              </View>
            </View>
          )}

          {/* Rent status card */}
          <Text style={styles.sectionTitle}>Rent Status</Text>
          {latest ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.rentMonth}>{latest.month}</Text>
                <View style={[styles.statusPill, { backgroundColor: (RENT_STATUS_CFG[latest.status] || RENT_STATUS_CFG.due).bg }]}>
                  <Text style={[styles.statusPillText, { color: (RENT_STATUS_CFG[latest.status] || RENT_STATUS_CFG.due).color }]}>
                    {(RENT_STATUS_CFG[latest.status] || RENT_STATUS_CFG.due).label}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Amount</Text>
                <Text style={styles.cardValue}>₹{(latest.amount || 0).toLocaleString('en-IN')}</Text>
              </View>
              {latest.paidOn && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Paid On</Text>
                  <Text style={styles.cardValue}>{latest.paidOn}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No rent records yet.</Text>
            </View>
          )}

          {/* Rent history */}
          {rentRecords.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>History</Text>
              {rentRecords.slice(1).map(rec => (
                <View key={rec.id} style={styles.historyRow}>
                  <Text style={styles.historyMonth}>{rec.month}</Text>
                  <Text style={[styles.historyStatus, { color: (RENT_STATUS_CFG[rec.status] || RENT_STATUS_CFG.due).color }]}>
                    {(RENT_STATUS_CFG[rec.status] || RENT_STATUS_CFG.due).label}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Maintenance requests */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Maintenance Requests</Text>
            <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(true)}>
              <Text style={styles.reportBtnText}>+ Report Issue</Text>
            </TouchableOpacity>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No maintenance requests yet.</Text>
            </View>
          ) : (
            requests.map(req => (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.rentMonth}>{req.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: (MAINT_STATUS_CFG[req.status] || MAINT_STATUS_CFG.open).bg }]}>
                    <Text style={[styles.statusPillText, { color: (MAINT_STATUS_CFG[req.status] || MAINT_STATUS_CFG.open).color }]}>
                      {(MAINT_STATUS_CFG[req.status] || MAINT_STATUS_CFG.open).label}
                    </Text>
                  </View>
                </View>
                {req.description ? <Text style={styles.reqDesc}>{req.description}</Text> : null}
                <Text style={styles.reqDate}>Reported {req.reportedOn}</Text>
              </View>
            ))
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      {renter && (
        <ReportIssueModal
          visible={showReport}
          onClose={() => setShowReport(false)}
          onSubmitted={refresh}
          renter={renter}
        />
      )}
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
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 14, marginTop: 6 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  reportBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, color: theme.colors.textLight },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rentMonth: { fontSize: 15, fontWeight: '800', color: theme.colors.text, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  cardLabel: { fontSize: 13, color: theme.colors.textLight },
  cardValue: { fontSize: 13, color: theme.colors.text, fontWeight: '700' },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  historyMonth: { fontSize: 14, color: theme.colors.text },
  historyStatus: { fontSize: 13, fontWeight: '700' },
  reqDesc: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8, lineHeight: 18 },
  reqDate: { fontSize: 12, color: theme.colors.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: theme.colors.bg, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text,
  },
  submitBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: theme.colors.textLight, fontSize: 14, fontWeight: '600' },
});
