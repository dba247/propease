import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, StatusBar, TextInput,
} from 'react-native';
import { theme } from '../data/theme';
import { getRenterById, getRentByRenter, getMaintenanceByRenter, addMaintenanceRequest } from '../data/propertyStore';

const CATEGORIES = ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Cleaning', 'Other'];

function getOrdinal(n) {
  if (!n) return '';
  const s = ['th','st','nd','rd'], v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}

export default function CustomerPortalScreen({ navigation, route }) {
  // Route may pass renterId (the person renting, not the property owner)
  const renterId  = route?.params?.renterId || route?.params?.customerId;
  const renter    = getRenterById(renterId);
  const rents     = getRentByRenter(renterId);
  const [maints, setMaints]       = useState(getMaintenanceByRenter(renterId));
  const [activeTab, setActiveTab] = useState('home');
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintForm, setMaintForm]         = useState({ issue: '', category: '' });

  const latestRent   = rents[0];
  const overdueCount = rents.filter(r => r.status === 'overdue').length;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive',
        onPress: () => (navigation.getParent() || navigation).reset({ index: 0, routes: [{ name: 'Landing' }] }) },
    ]);
  };

  const submitMaint = () => {
    if (!maintForm.issue || !maintForm.category) {
      Alert.alert('Missing Info', 'Please describe the issue and select a category.');
      return;
    }
    addMaintenanceRequest({
      renterId,
      renterName: renter?.name || '',
      unit:       renter?.unit || '',
      propertyId: renter?.propertyId || '',
      propertyName: renter?.propertyName || '',
      issue:    maintForm.issue,
      category: maintForm.category,
      priority: 'medium',
    });
    setMaints(getMaintenanceByRenter(renterId));
    setMaintForm({ issue: '', category: '' });
    setShowMaintForm(false);
    Alert.alert('✅ Submitted', 'Your request has been sent to the property manager.');
  };

  // ── Tab renderers ──────────────────────────────────────────

  const renderHome = () => (
    <>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeName}>
          Hi, {renter?.name?.split(' ')[0] || 'Customer'} 👋
        </Text>
        <Text style={styles.welcomeSub}>
          {renter?.unit ? `Unit ${renter.unit} · ` : ''}{renter?.propertyName || ''}
        </Text>
      </View>

      <View style={styles.rentCard}>
        <Text style={styles.rentCardLabel}>Monthly Rent</Text>
        <Text style={styles.rentCardAmount}>
          ₹{renter?.rentAmount?.toLocaleString('en-IN') || '—'}
        </Text>
        <Text style={styles.rentCardDue}>
          Due on {renter?.rentDueDate}{getOrdinal(renter?.rentDueDate)} of every month
        </Text>
        {latestRent && (
          <View style={[styles.rentStatusBadge, {
            backgroundColor: latestRent.status === 'paid' ? '#ecfdf5' : latestRent.status === 'overdue' ? '#fef2f2' : '#fffbeb',
            borderColor:     latestRent.status === 'paid' ? '#a7f3d0' : latestRent.status === 'overdue' ? '#fecaca' : '#fde68a',
          }]}>
            <Text style={[styles.rentStatusText, {
              color: latestRent.status === 'paid' ? theme.colors.success
                   : latestRent.status === 'overdue' ? theme.colors.danger
                   : '#d97706',
            }]}>
              {latestRent.status === 'paid' ? '✅ Paid'
               : latestRent.status === 'overdue' ? '🚨 Overdue'
               : '⏳ Due'} — {latestRent.month}
            </Text>
          </View>
        )}
        {!latestRent && (
          <Text style={{ color: theme.colors.textLight, marginTop: 10, fontSize: 12 }}>
            No rent records yet — contact your manager.
          </Text>
        )}
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard} onPress={() => setActiveTab('rent')}>
          <Text style={styles.quickIcon}>💰</Text>
          <Text style={styles.quickLabel}>Rent History</Text>
          {overdueCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{overdueCount}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => setActiveTab('property')}>
          <Text style={styles.quickIcon}>🏠</Text>
          <Text style={styles.quickLabel}>My Property</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => setActiveTab('maintenance')}>
          <Text style={styles.quickIcon}>🔧</Text>
          <Text style={styles.quickLabel}>Maintenance</Text>
          {maints.filter(m => m.status !== 'resolved').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{maints.filter(m => m.status !== 'resolved').length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderRent = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 Rent History</Text>
      <View style={styles.rentSummaryRow}>
        <View style={styles.rentSummaryItem}>
          <Text style={styles.rentSummaryVal}>₹{renter?.rentAmount?.toLocaleString('en-IN') || '0'}</Text>
          <Text style={styles.rentSummaryLabel}>Monthly</Text>
        </View>
        <View style={styles.rentSummaryItem}>
          <Text style={[styles.rentSummaryVal, { color: theme.colors.danger }]}>
            {rents.filter(r => r.status !== 'paid').length}
          </Text>
          <Text style={styles.rentSummaryLabel}>Pending</Text>
        </View>
        <View style={styles.rentSummaryItem}>
          <Text style={[styles.rentSummaryVal, { color: theme.colors.success }]}>
            {rents.filter(r => r.status === 'paid').length}
          </Text>
          <Text style={styles.rentSummaryLabel}>Paid</Text>
        </View>
      </View>
      {rents.length === 0 && <Text style={styles.emptyText}>No rent records yet.</Text>}
      {rents.map(r => (
        <View key={r.id} style={[styles.rentHistCard, {
          borderLeftColor: r.status === 'paid' ? theme.colors.success
                         : r.status === 'overdue' ? theme.colors.danger : '#d97706',
        }]}>
          <View style={styles.rentHistRow}>
            <View>
              <Text style={styles.rentHistMonth}>{r.month}</Text>
              {r.paidOn
                ? <Text style={styles.rentHistMeta}>Paid {r.paidOn} · {r.method}</Text>
                : <Text style={[styles.rentHistMeta, { color: theme.colors.danger }]}>
                    Due {r.dueDate}{getOrdinal(r.dueDate)}
                  </Text>
              }
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rentHistAmt}>₹{(r.amount || 0).toLocaleString('en-IN')}</Text>
              <Text style={[styles.rentHistStatus, {
                color: r.status === 'paid' ? theme.colors.success
                     : r.status === 'overdue' ? theme.colors.danger : '#d97706',
              }]}>
                {r.status === 'paid' ? '✅ Paid' : r.status === 'overdue' ? '🚨 Overdue' : '⏳ Due'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderProperty = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏠 My Property</Text>
      <View style={styles.propCard}>
        {[
          { label: 'Property',     value: renter?.propertyName || '—' },
          { label: 'Address',      value: renter?.propertyAddress || '—' },
          { label: 'Unit',         value: renter?.unit || '—' },
          { label: 'Monthly Rent', value: `₹${renter?.rentAmount?.toLocaleString('en-IN') || '—'}` },
          { label: 'Due Date',     value: renter?.rentDueDate ? `${renter.rentDueDate}${getOrdinal(renter.rentDueDate)} of every month` : '—' },
          { label: 'Lease Start',  value: renter?.leaseStart || '—' },
          { label: 'Lease End',    value: renter?.leaseEnd || '—' },
        ].map(r => (
          <View style={styles.propRow} key={r.label}>
            <Text style={styles.propLabel}>{r.label}</Text>
            <Text style={styles.propValue}>{r.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMaintenance = () => (
    <View style={styles.section}>
      <View style={styles.maintHeader}>
        <Text style={styles.sectionTitle}>🔧 Maintenance</Text>
        <TouchableOpacity style={styles.newMaintBtn} onPress={() => setShowMaintForm(!showMaintForm)}>
          <Text style={styles.newMaintBtnText}>{showMaintForm ? 'Cancel' : '+ Report Issue'}</Text>
        </TouchableOpacity>
      </View>

      {showMaintForm && (
        <View style={styles.maintForm}>
          <Text style={styles.label}>Describe the Issue *</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="e.g. Water leaking from bathroom tap..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            value={maintForm.issue}
            onChangeText={v => setMaintForm({ ...maintForm, issue: v })}
          />
          <Text style={styles.label}>Category *</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catChip, maintForm.category === c && styles.catChipActive]}
                onPress={() => setMaintForm({ ...maintForm, category: c })}
              >
                <Text style={[styles.catText, maintForm.category === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.submitMaintBtn} onPress={submitMaint}>
            <Text style={styles.submitMaintText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {maints.length === 0 && <Text style={styles.emptyText}>No maintenance requests yet.</Text>}
      {maints.map(m => (
        <View key={m.id} style={styles.maintCard}>
          <View style={styles.maintCardTop}>
            <Text style={styles.maintCatTag}>{m.category}</Text>
            <Text style={[styles.maintCardStatus, {
              color: m.status === 'resolved' ? theme.colors.success
                   : m.status === 'in-progress' ? '#d97706' : theme.colors.danger,
            }]}>
              {m.status === 'resolved' ? '🟢 Resolved' : m.status === 'in-progress' ? '🟡 In Progress' : '🔴 Open'}
            </Text>
          </View>
          <Text style={styles.maintIssue}>{m.issue}</Text>
          <Text style={styles.maintDate}>Reported: {m.reportedOn}</Text>
        </View>
      ))}
    </View>
  );

  const TABS = [
    { id: 'home',        label: '🏠 Home' },
    { id: 'rent',        label: '💰 Rent' },
    { id: 'property',    label: '🏘️ Property' },
    { id: 'maintenance', label: '🔧 Requests' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Customer Portal</Text>
          <Text style={styles.headerName}>{renter?.name || 'Customer'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>⏻ Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text style={[styles.tabBtnText, activeTab === t.id && styles.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'home'        && renderHome()}
        {activeTab === 'rent'        && renderRent()}
        {activeTab === 'property'    && renderProperty()}
        {activeTab === 'maintenance' && renderMaintenance()}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 18, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting: { color: '#90b8d8', fontSize: 12 },
  headerName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  tabBar: { backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 10 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
  tabBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  tabBtnTextActive: { color: '#fff' },
  welcomeCard: { backgroundColor: theme.colors.primary, margin: 16, borderRadius: theme.radius.xl, padding: 20 },
  welcomeName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  welcomeSub: { color: '#90b8d8', fontSize: 13, marginTop: 4 },
  rentCard: { backgroundColor: theme.colors.card, marginHorizontal: 16, marginBottom: 16, borderRadius: theme.radius.xl, padding: 24, alignItems: 'center', ...theme.shadow },
  rentCardLabel: { color: theme.colors.textSecondary, fontSize: 13 },
  rentCardAmount: { color: theme.colors.primary, fontSize: 38, fontWeight: '900', marginTop: 6 },
  rentCardDue: { color: theme.colors.textLight, fontSize: 12, marginTop: 4 },
  rentStatusBadge: { marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  rentStatusText: { fontSize: 13, fontWeight: '700' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  quickCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16, alignItems: 'center', ...theme.shadow, position: 'relative' },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, textAlign: 'center' },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: theme.colors.danger, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 14 },
  rentSummaryRow: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16, marginBottom: 14, ...theme.shadow },
  rentSummaryItem: { flex: 1, alignItems: 'center' },
  rentSummaryVal: { fontSize: 22, fontWeight: '900', color: theme.colors.primary },
  rentSummaryLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  rentHistCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 14, marginBottom: 10, borderLeftWidth: 4, ...theme.shadow },
  rentHistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rentHistMonth: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  rentHistMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
  rentHistAmt: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  rentHistStatus: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  propCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 18, ...theme.shadow },
  propRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  propLabel: { fontSize: 13, color: theme.colors.textSecondary },
  propValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text, maxWidth: '55%', textAlign: 'right' },
  maintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  newMaintBtn: { backgroundColor: theme.colors.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  newMaintBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  maintForm: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16, marginBottom: 14, ...theme.shadow },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.text, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: theme.colors.bg, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: theme.colors.text },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: theme.colors.bg, borderWidth: 1.5, borderColor: theme.colors.border },
  catChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  catText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  submitMaintBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, paddingVertical: 13, alignItems: 'center' },
  submitMaintText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  maintCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 14, marginBottom: 10, ...theme.shadow },
  maintCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  maintCatTag: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, backgroundColor: theme.colors.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  maintCardStatus: { fontSize: 12, fontWeight: '700' },
  maintIssue: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  maintDate: { fontSize: 11, color: theme.colors.textSecondary },
  emptyText: { color: theme.colors.textLight, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});