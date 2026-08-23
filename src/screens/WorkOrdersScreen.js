import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, StatusBar, Modal, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import {
  getWorkOrders, addWorkOrder, updateWorkOrder,
  getCustomers, getProperties, WO_CATEGORIES,
} from '../data/propertyStore';

const PRIORITIES = [
  { label: 'Low',      color: theme.colors.success,  bg: '#ecfdf5' },
  { label: 'Medium',   color: '#d97706',              bg: '#fffbeb' },
  { label: 'High',     color: theme.colors.danger,   bg: '#fef2f2' },
  { label: 'Urgent',   color: '#7c3aed',              bg: '#f5f3ff' },
];

const STATUSES = [
  { key: 'open',        label: '🔴 Open',        color: theme.colors.danger },
  { key: 'in-progress', label: '🟡 In Progress', color: '#d97706' },
  { key: 'completed',   label: '🟢 Completed',   color: theme.colors.success },
  { key: 'cancelled',   label: '⚫ Cancelled',   color: theme.colors.textLight },
];

function statusCfg(key) { return STATUSES.find(s => s.key === key) || STATUSES[0]; }
function priorityCfg(label) { return PRIORITIES.find(p => p.label.toLowerCase() === label?.toLowerCase()) || PRIORITIES[1]; }

// ── Create Work Order Modal ───────────────────────────────────
function CreateWorkOrderModal({ visible, onClose, onCreated }) {
  const [customers, setCustomers]   = useState([]);
  const [properties, setProperties] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    Promise.all([getCustomers(), getProperties()]).then(([c, p]) => {
      if (!active) return;
      setCustomers(c);
      setProperties(p);
    }).catch(e => console.error('[WorkOrdersScreen] load failed:', e));
    return () => { active = false; };
  }, [visible]);

  const [form, setForm] = useState({
    title: '', category: '', priority: 'Medium',
    customerId: '', propertyId: '',
    scheduledDate: '', vendorName: '', vendorPhone: '',
    estimatedCost: '', notes: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const selectedCustomer   = customers.find(t => t.id === form.customerId);
  const selectedProperty = properties.find(p => p.id === form.propertyId);

  const handleCreate = async () => {
    if (!form.title || !form.category) {
      Alert.alert('Missing Info', 'Please enter a title and select a category.');
      return;
    }
    if (!form.customerId && !form.propertyId) {
      Alert.alert('Missing Info', 'Please link this work order to a customer or property.');
      return;
    }
    setSaving(true);
    try {
      const wo = await addWorkOrder({
        title: form.title,
        category: form.category,
        priority: form.priority,
        customerId: form.customerId || null,
        customerName: selectedCustomer?.name || '',
        propertyId: form.customerId ? selectedCustomer?.propertyId : form.propertyId,
        propertyName: form.customerId ? selectedCustomer?.propertyName : selectedProperty?.name || '',
        unit: selectedCustomer?.unit || '',
        scheduledDate: form.scheduledDate,
        vendorName: form.vendorName,
        vendorPhone: form.vendorPhone,
        estimatedCost: form.estimatedCost,
        notes: form.notes,
      });
      setForm({ title: '', category: '', priority: 'Medium', customerId: '', propertyId: '', scheduledDate: '', vendorName: '', vendorPhone: '', estimatedCost: '', notes: '' });
      onCreated(wo);
      onClose();
    } catch (e) {
      console.error('[WorkOrdersScreen] addWorkOrder failed:', e);
      Alert.alert('Error', 'Could not save the work order. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>✕ Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>New Work Order</Text>
          <TouchableOpacity onPress={handleCreate}><Text style={styles.modalSave}>Save ✓</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>

          {/* Title */}
          <Text style={styles.label}>Work Order Title *</Text>
          <TextInput style={styles.input} placeholder="e.g. Fix bathroom plumbing leak"
            placeholderTextColor={theme.colors.textLight}
            value={form.title} onChangeText={v => set('title', v)} />

          {/* Category */}
          <Text style={styles.label}>Category *</Text>
          <View style={styles.catGrid}>
            {WO_CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.label}
                style={[styles.catChip, form.category === c.label && styles.catChipActive]}
                onPress={() => set('category', c.label)}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={[styles.catLabel, form.category === c.label && styles.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity
                key={p.label}
                style={[styles.priorityChip, { borderColor: p.color, backgroundColor: form.priority === p.label ? p.color : p.bg }]}
                onPress={() => set('priority', p.label)}
              >
                <Text style={[styles.priorityLabel, { color: form.priority === p.label ? '#fff' : p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Link to Customer */}
          <Text style={styles.label}>Link to Customer</Text>
          <View style={styles.selectorBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.selectorChip, !form.customerId && styles.selectorChipActive]}
                onPress={() => set('customerId', '')}
              >
                <Text style={[styles.selectorText, !form.customerId && styles.selectorTextActive]}>None</Text>
              </TouchableOpacity>
              {customers.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.selectorChip, form.customerId === t.id && styles.selectorChipActive]}
                  onPress={() => set('customerId', t.id)}
                >
                  <Text style={[styles.selectorText, form.customerId === t.id && styles.selectorTextActive]}>
                    {t.name} · {t.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Link to Property (if no customer selected) */}
          {!form.customerId && properties.length > 0 && (
            <>
              <Text style={styles.label}>Or Link to Property</Text>
              <View style={styles.selectorBox}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {properties.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.selectorChip, form.propertyId === p.id && styles.selectorChipActive]}
                      onPress={() => set('propertyId', p.id)}
                    >
                      <Text style={[styles.selectorText, form.propertyId === p.id && styles.selectorTextActive]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Scheduled Date */}
          <Text style={styles.label}>Scheduled Date</Text>
          <TextInput style={styles.input} placeholder="DD-MM-YYYY"
            placeholderTextColor={theme.colors.textLight}
            value={form.scheduledDate} onChangeText={v => set('scheduledDate', v)} />

          {/* Vendor */}
          <Text style={styles.label}>Vendor / Contractor Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Raju Plumbing Services"
            placeholderTextColor={theme.colors.textLight}
            value={form.vendorName} onChangeText={v => set('vendorName', v)} />

          <Text style={styles.label}>Vendor Phone</Text>
          <TextInput style={styles.input} placeholder="9876543210"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="phone-pad"
            value={form.vendorPhone} onChangeText={v => set('vendorPhone', v)} />

          {/* Cost */}
          <Text style={styles.label}>Estimated Cost (₹)</Text>
          <TextInput style={styles.input} placeholder="e.g. 2500"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="numeric"
            value={form.estimatedCost} onChangeText={v => set('estimatedCost', v)} />

          {/* Notes */}
          <Text style={styles.label}>Notes / Instructions</Text>
          <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Any additional instructions for the vendor..."
            placeholderTextColor={theme.colors.textLight}
            multiline
            value={form.notes} onChangeText={v => set('notes', v)} />

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>📋  Create Work Order</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Work Order Detail Modal ───────────────────────────────────
function WorkOrderDetail({ wo, onClose, onUpdated }) {
  const [actualCost, setActualCost] = useState(wo.actualCost || '');
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status) => {
    const updates = { status };
    if (status === 'completed') updates.actualCost = actualCost;
    setUpdating(true);
    try {
      await updateWorkOrder(wo.id, updates);
      onUpdated();
      if (status === 'completed') Alert.alert('✅ Work Order Completed', 'The work order has been marked as completed.');
      else onClose();
    } catch (e) {
      console.error('[WorkOrdersScreen] updateWorkOrder failed:', e);
      Alert.alert('Error', 'Could not update the work order. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const pc = priorityCfg(wo.priority);
  const sc = statusCfg(wo.status);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>← Back</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Work Order</Text>
          <Text style={[styles.woStatusTag, { color: sc.color }]}>{sc.label}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Title & badges */}
          <Text style={styles.detailTitle}>{wo.title}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.catBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.catBadgeText, { color: theme.colors.primary }]}>
                {WO_CATEGORIES.find(c => c.label === wo.category)?.icon} {wo.category}
              </Text>
            </View>
            <View style={[styles.catBadge, { backgroundColor: pc.bg }]}>
              <Text style={[styles.catBadgeText, { color: pc.color }]}>{wo.priority} Priority</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            {[
              { label: 'Customer',   value: wo.customerName || '—' },
              { label: 'Property',   value: wo.propertyName || '—' },
              { label: 'Unit',       value: wo.unit || '—' },
              { label: 'Created',    value: wo.createdOn },
              { label: 'Scheduled',  value: wo.scheduledDate || 'Not set' },
              { label: 'Vendor',     value: wo.vendorName || 'Not assigned' },
              { label: 'Vendor Ph.', value: wo.vendorPhone || '—' },
              { label: 'Est. Cost',  value: wo.estimatedCost ? `₹${wo.estimatedCost}` : '—' },
              { label: 'Actual Cost',value: wo.actualCost ? `₹${wo.actualCost}` : '—' },
              { label: 'Completed',  value: wo.completedOn || '—' },
            ].map(r => (
              <View style={styles.detailRow} key={r.label}>
                <Text style={styles.detailLabel}>{r.label}</Text>
                <Text style={styles.detailValue}>{r.value}</Text>
              </View>
            ))}
            {wo.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{wo.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* Status actions */}
          {wo.status !== 'completed' && wo.status !== 'cancelled' && (
            <View style={styles.actionSection}>
              <Text style={styles.label}>Update Status</Text>
              <View style={styles.statusActions}>
                {wo.status === 'open' && (
                  <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#fffbeb', borderColor: '#d97706' }]}
                    onPress={() => handleStatus('in-progress')}>
                    <Text style={[styles.statusBtnText, { color: '#d97706' }]}>🟡 Start Work</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#ecfdf5', borderColor: theme.colors.success }]}
                  onPress={() => handleStatus('completed')}>
                  <Text style={[styles.statusBtnText, { color: theme.colors.success }]}>🟢 Mark Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.statusBtn, { backgroundColor: '#f9fafb', borderColor: theme.colors.textLight }]}
                  onPress={() => handleStatus('cancelled')}>
                  <Text style={[styles.statusBtnText, { color: theme.colors.textLight }]}>⚫ Cancel</Text>
                </TouchableOpacity>
              </View>

              {(wo.status === 'in-progress') && (
                <>
                  <Text style={[styles.label, { marginTop: 16 }]}>Actual Cost (₹) — on completion</Text>
                  <TextInput style={styles.input} placeholder="Enter actual cost"
                    placeholderTextColor={theme.colors.textLight}
                    keyboardType="numeric"
                    value={actualCost} onChangeText={setActualCost} />
                </>
              )}
            </View>
          )}

          {(wo.status === 'completed' || wo.status === 'cancelled') && (
            <View style={[styles.closedBanner, { backgroundColor: wo.status === 'completed' ? '#ecfdf5' : '#f9fafb', borderColor: wo.status === 'completed' ? '#a7f3d0' : theme.colors.border }]}>
              <Text style={[styles.closedText, { color: wo.status === 'completed' ? theme.colors.success : theme.colors.textLight }]}>
                {wo.status === 'completed' ? `✅ Completed on ${wo.completedOn}` : '⚫ This work order was cancelled'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Work Orders Screen ───────────────────────────────────
export default function WorkOrdersScreen() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [filterStatus, setFilter] = useState('All');

  const refresh = () => {
    getWorkOrders()
      .then(setOrders)
      .catch(e => console.error('[WorkOrdersScreen] getWorkOrders failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const filterOptions = ['All', 'Open', 'In Progress', 'Completed', 'Cancelled'];
  const filtered = orders.filter(o => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'In Progress') return o.status === 'in-progress';
    return o.status === filterStatus.toLowerCase();
  });

  const counts = {
    open: orders.filter(o => o.status === 'open').length,
    inProgress: orders.filter(o => o.status === 'in-progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Work Orders</Text>
          <Text style={styles.headerSub}>Manage repairs & maintenance jobs</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.danger }]}>{counts.open}</Text>
          <Text style={styles.summaryLabel}>Open</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: '#d97706' }]}>{counts.inProgress}</Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: theme.colors.success }]}>{counts.completed}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {filterOptions.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filterStatus === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Work order list */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        {!loading && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No work orders yet</Text>
            <Text style={styles.emptyDesc}>Tap "+ New" to create your first work order.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>Create Work Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.map(wo => {
          const sc = statusCfg(wo.status);
          const pc = priorityCfg(wo.priority);
          return (
            <TouchableOpacity key={wo.id} style={styles.woCard} onPress={() => setSelected(wo)}>
              <View style={styles.woCardTop}>
                <View style={[styles.woCatDot, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={styles.woCatDotIcon}>
                    {WO_CATEGORIES.find(c => c.label === wo.category)?.icon || '🔨'}
                  </Text>
                </View>
                <View style={styles.woCardInfo}>
                  <Text style={styles.woTitle}>{wo.title}</Text>
                  <Text style={styles.woMeta}>
                    {wo.customerName ? `${wo.customerName} · ` : ''}{wo.propertyName}{wo.unit ? ` · ${wo.unit}` : ''}
                  </Text>
                  <Text style={styles.woDate}>Created {wo.createdOn}{wo.scheduledDate ? ` · Scheduled ${wo.scheduledDate}` : ''}</Text>
                </View>
              </View>
              <View style={styles.woCardBottom}>
                <View style={[styles.woPriority, { backgroundColor: pc.bg }]}>
                  <Text style={[styles.woPriorityText, { color: pc.color }]}>{wo.priority}</Text>
                </View>
                <Text style={[styles.woStatus, { color: sc.color }]}>{sc.label}</Text>
                {wo.vendorName ? <Text style={styles.woVendor}>👷 {wo.vendorName}</Text> : null}
                {wo.estimatedCost ? <Text style={styles.woCost}>₹{wo.estimatedCost}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 30 }} />
      </ScrollView>

      <CreateWorkOrderModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => refresh()}
      />

      {selected && (
        <WorkOrderDetail
          wo={orders.find(o => o.id === selected.id) || selected}
          onClose={() => { setSelected(null); refresh(); }}
          onUpdated={() => { refresh(); setSelected(s => orders.find(o => o.id === s?.id) || s); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { color: '#90b8d8', fontSize: 12, marginTop: 3 },
  newBtn: { backgroundColor: theme.colors.accent, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  newBtnText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  summaryBar: { flexDirection: 'row', backgroundColor: theme.colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: theme.radius.lg, padding: 14, ...theme.shadow },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 24, fontWeight: '900' },
  summaryLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
  filterRow: { marginVertical: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  filterTextActive: { color: '#fff' },
  woCard: { backgroundColor: theme.colors.card, marginHorizontal: 16, marginBottom: 10, borderRadius: theme.radius.lg, padding: 16, ...theme.shadow },
  woCardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  woCatDot: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  woCatDotIcon: { fontSize: 22 },
  woCardInfo: { flex: 1 },
  woTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  woMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  woDate: { fontSize: 11, color: theme.colors.textLight, marginTop: 2 },
  woCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  woPriority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  woPriorityText: { fontSize: 11, fontWeight: '700' },
  woStatus: { fontSize: 12, fontWeight: '700' },
  woVendor: { fontSize: 11, color: theme.colors.textSecondary, marginLeft: 'auto' },
  woCost: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  emptyState: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  emptyDesc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' },
  emptyBtn: { marginTop: 20, backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, paddingVertical: 13, paddingHorizontal: 28 },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  // Modal shared
  modal: { flex: 1, backgroundColor: theme.colors.bg },
  modalHeader: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCancel: { color: '#a0c0e0', fontSize: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalSave: { color: theme.colors.accent, fontSize: 14, fontWeight: '800' },
  woStatusTag: { fontSize: 13, fontWeight: '700' },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: theme.colors.text },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1.5, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 5 },
  catChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  catIcon: { fontSize: 16 },
  catLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  catLabelActive: { color: '#fff' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  priorityLabel: { fontSize: 12, fontWeight: '700' },
  selectorBox: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border, padding: 12 },
  selectorChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border },
  selectorChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  selectorText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  selectorTextActive: { color: '#fff' },
  createBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // Detail
  detailTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  catBadgeText: { fontSize: 12, fontWeight: '700' },
  detailCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: 16, ...theme.shadow },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  detailLabel: { fontSize: 13, color: theme.colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text, maxWidth: '55%', textAlign: 'right' },
  notesBox: { paddingTop: 12 },
  notesLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 13, color: theme.colors.text, lineHeight: 20 },
  actionSection: { marginTop: 20 },
  statusActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBtn: { flex: 1, minWidth: '30%', paddingVertical: 12, borderRadius: theme.radius.md, borderWidth: 1.5, alignItems: 'center' },
  statusBtnText: { fontSize: 13, fontWeight: '700' },
  closedBanner: { marginTop: 20, borderRadius: theme.radius.md, borderWidth: 1.5, padding: 16, alignItems: 'center' },
  closedText: { fontSize: 14, fontWeight: '700' },
});