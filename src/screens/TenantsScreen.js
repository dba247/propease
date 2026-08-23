import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import { getRenters, getRentByRenter } from '../data/propertyStore';
import { TenantDetail } from './CustomersScreen';

const STATUS_CFG = {
  paid:    { color: theme.colors.success, bg: '#ecfdf5', label: '✅ Paid' },
  due:     { color: '#d97706',            bg: '#fffbeb', label: '⏳ Due' },
  overdue: { color: theme.colors.danger,  bg: '#fef2f2', label: '🚨 Overdue' },
};

export default function TenantsScreen() {
  const [renters, setRenters]       = useState([]);
  const [latestRent, setLatestRent] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);

  const refresh = () => {
    setLoading(true);
    getRenters()
      .then(async (rs) => {
        setRenters(rs);
        const entries = await Promise.all(
          rs.map(async r => [r.id, (await getRentByRenter(r.id))[0] || null])
        );
        setLatestRent(Object.fromEntries(entries));
      })
      .catch(e => console.error('[TenantsScreen] getRenters failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  if (selected) {
    return <TenantDetail renter={selected} onBack={() => { setSelected(null); refresh(); }} />;
  }

  const filtered = renters.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.name?.toLowerCase().includes(q) ||
      r.mobile?.includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.propertyName?.toLowerCase().includes(q) ||
      r.propertyAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tenants</Text>
        <Text style={styles.headerSub}>{renters.length} total across all owners</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, property, or owner..."
          placeholderTextColor={theme.colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {renters.length === 0 ? 'No tenants yet.' : 'No tenants match your search.'}
            </Text>
            {renters.length === 0 && (
              <Text style={styles.emptySub}>Add tenants from the Customers tab, under each property owner.</Text>
            )}
          </View>
        )}

        {filtered.map(r => {
          const latest = latestRent[r.id];
          const cfg = latest ? (STATUS_CFG[latest.status] || STATUS_CFG.due) : null;
          return (
            <TouchableOpacity key={r.id} style={styles.card} onPress={() => setSelected(r)}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenantName}>{r.name}</Text>
                  <Text style={styles.tenantMeta}>{r.propertyName}{r.unit ? ` • Unit ${r.unit}` : ''}</Text>
                  <Text style={styles.tenantOwner}>Owner: {r.customerName || '—'}</Text>
                </View>
                {cfg && (
                  <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardBottomText}>📞 {r.mobile}</Text>
                <Text style={styles.cardBottomText}>₹{(r.rentAmount || 0).toLocaleString('en-IN')}/mo</Text>
              </View>
            </TouchableOpacity>
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
    backgroundColor: theme.colors.primary, paddingTop: 54, paddingBottom: 16, paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#a0c0e0', fontSize: 13, marginTop: 2 },
  searchBox: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: theme.colors.card },
  searchInput: {
    backgroundColor: theme.colors.bg, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: theme.colors.text,
  },
  body: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: theme.colors.textLight, textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  tenantName: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  tenantMeta: { fontSize: 13, color: theme.colors.textLight, marginTop: 2 },
  tenantOwner: { fontSize: 12, color: theme.colors.textLight, marginTop: 4, fontStyle: 'italic' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  cardBottomText: { fontSize: 13, color: theme.colors.text, fontWeight: '600' },
});
