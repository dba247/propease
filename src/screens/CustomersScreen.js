/**
 * CustomersScreen.js
 *
 * Flow:
 *   Customers list
 *     → Customer detail (info + tenants list)
 *           → Add Tenant modal
 *           → Tenant detail (full info, rent history, mark paid)
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, StatusBar, Modal, ActivityIndicator,
} from 'react-native';
import { theme } from '../data/theme';
import {
  getCustomers, addCustomer,
  getRentersByCustomer, addRenter,
  getRentByRenter, markRentPaid, addRentRecord,
} from '../data/propertyStore';
import { createOwnerAccount, createTenantAccount } from '../data/accountStore';

// ─── Helpers ─────────────────────────────────────────────────
function getOrdinal(n) {
  if (!n) return '';
  const s = ['th','st','nd','rd'], v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}
function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
}
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
function currentMonth() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

const STATUS_CFG = {
  paid:    { color: theme.colors.success, bg: '#ecfdf5', label: '✅ Paid' },
  due:     { color: '#d97706',            bg: '#fffbeb', label: '⏳ Due' },
  overdue: { color: theme.colors.danger,  bg: '#fef2f2', label: '🚨 Overdue' },
};

// ─── Field component ─────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, keyboard, multiline, maxLength }) {
  return (
    <View style={f.group}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        placeholder={placeholder || ''}
        placeholderTextColor={theme.colors.textLight}
        keyboardType={keyboard || 'default'}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
      />
    </View>
  );
}
const f = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: theme.colors.text,
  },
});

// ─── Add Customer Modal ───────────────────────────────────────
function AddCustomerModal({ visible, onClose, onAdded }) {
  const [form, setForm] = useState({ name:'', mobile:'', email:'', address:'', password:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      Alert.alert('Required', 'Please enter customer name and mobile number.');
      return;
    }
    if (!form.email.trim()) {
      Alert.alert('Required', 'Please enter an email — the owner will use it to log in.');
      return;
    }
    if (!form.password.trim() || form.password.trim().length < 6) {
      Alert.alert('Required', 'Please set a login password (at least 6 characters) for this owner.');
      return;
    }
    setSaving(true);
    try {
      const customer = await addCustomer({
        name: form.name.trim(), mobile: form.mobile.trim(),
        email: form.email.trim(), address: form.address.trim(),
      });
      const acct = await createOwnerAccount({
        name: form.name.trim(), mobile: form.mobile.trim(), countryCode: '+91',
        email: form.email.trim(), password: form.password.trim(),
        customerId: customer.id,
      });
      if (!acct.success) {
        Alert.alert('Owner Saved, Login Not Created', acct.error || 'Could not create a login for this owner. You can retry from their profile later.');
      }
      setForm({ name:'', mobile:'', email:'', address:'', password:'' });
      onAdded(customer);
      onClose();
    } catch (e) {
      console.error('[CustomersScreen] addCustomer failed:', e);
      Alert.alert('Error', 'Could not save the customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.modal}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.modalTitle}>Add Customer</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.modalSave}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalBody}>
          <Field label="Full Name *"     value={form.name}    onChangeText={v=>set('name',v)}    placeholder="Suresh Mehta" />
          <Field label="Mobile *"        value={form.mobile}  onChangeText={v=>set('mobile',v)}  placeholder="9876543210" keyboard="phone-pad" maxLength={15} />
          <Field label="Email *"         value={form.email}   onChangeText={v=>set('email',v)}   placeholder="suresh@email.com" keyboard="email-address" />
          <Field label="Customer Address" value={form.address} onChangeText={v=>set('address',v)} placeholder="Customer's own address" multiline />
          <Text style={s.modalSection}>🔑 Owner Login</Text>
          <Field label="Set Login Password *" value={form.password} onChangeText={v=>set('password',v)} placeholder="At least 6 characters" />
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Add Customer →</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Add Tenant Modal ─────────────────────────────────────────
function AddTenantModal({ visible, customer, onClose, onAdded }) {
  const year = new Date().getFullYear();
  const [form, setForm] = useState({
    name:'', mobile:'', email:'', password:'',
    rentalAddress:'', unit:'',
    rentAmount:'', securityDeposit:'',
    leaseStart:'', leaseEnd:'', rentDueDate:'1',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      Alert.alert('Required', 'Please enter tenant name and mobile number.');
      return;
    }
    if (!form.email.trim()) {
      Alert.alert('Required', 'Please enter an email — the tenant will use it to log in.');
      return;
    }
    if (!form.password.trim() || form.password.trim().length < 6) {
      Alert.alert('Required', 'Please set a login password (at least 6 characters) for this tenant.');
      return;
    }
    if (!form.rentAmount.trim()) {
      Alert.alert('Required', 'Please enter the monthly rent amount.');
      return;
    }
    if (!form.rentalAddress.trim()) {
      Alert.alert('Required', 'Please enter the rental property address.');
      return;
    }
    setSaving(true);
    try {
      const renter = await addRenter({
        name:            form.name.trim(),
        mobile:          form.mobile.trim(),
        email:           form.email.trim(),
        propertyAddress: form.rentalAddress.trim(),
        propertyName:    form.rentalAddress.trim(),
        unit:            form.unit.trim(),
        rentAmount:      parseFloat(form.rentAmount) || 0,
        securityDeposit: parseFloat(form.securityDeposit) || 0,
        leaseStart:      form.leaseStart.trim(),
        leaseEnd:        form.leaseEnd.trim(),
        rentDueDate:     parseInt(form.rentDueDate) || 1,
        customerId:      customer.id,
        customerName:    customer.name,
        propertyId:      customer.id, // use customer id as property id for simplicity
      });
      const acct = await createTenantAccount({
        name: form.name.trim(), mobile: form.mobile.trim(), countryCode: '+91',
        email: form.email.trim(), password: form.password.trim(),
        renterId: renter.id, customerId: customer.id,
      });
      if (!acct.success) {
        Alert.alert('Tenant Saved, Login Not Created', acct.error || 'Could not create a login for this tenant. You can retry from their profile later.');
      }
      setForm({ name:'', mobile:'', email:'', password:'', rentalAddress:'', unit:'', rentAmount:'', securityDeposit:'', leaseStart:'', leaseEnd:'', rentDueDate:'1' });
      onAdded(renter);
      onClose();
    } catch (e) {
      console.error('[CustomersScreen] addRenter failed:', e);
      Alert.alert('Error', 'Could not save the tenant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.modal}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.modalTitle}>Add Tenant</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.modalSave}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalBody}>
          <Text style={s.modalNote}>
            Adding tenant for customer:{' '}
            <Text style={{ fontWeight:'800', color: theme.colors.primary }}>{customer?.name}</Text>
          </Text>

          <Text style={s.modalSection}>👤 Tenant Contact Info</Text>
          <Field label="Full Name *"     value={form.name}   onChangeText={v=>set('name',v)}   placeholder="Rahul Sharma" />
          <Field label="Mobile *"        value={form.mobile} onChangeText={v=>set('mobile',v)} placeholder="9876543210" keyboard="phone-pad" maxLength={15} />
          <Field label="Email *"         value={form.email}  onChangeText={v=>set('email',v)}  placeholder="rahul@gmail.com" keyboard="email-address" />

          <Text style={s.modalSection}>🔑 Tenant Login</Text>
          <Field label="Set Login Password *" value={form.password} onChangeText={v=>set('password',v)} placeholder="At least 6 characters" />

          <Text style={s.modalSection}>🏠 Rental Property</Text>
          <Field label="Rental Property Address *" value={form.rentalAddress} onChangeText={v=>set('rentalAddress',v)} placeholder="12, MG Road, Koramangala, Bangalore 560034" multiline />
          <Field label="Unit / Flat No"  value={form.unit}   onChangeText={v=>set('unit',v)}   placeholder="A-101 (optional)" />

          <Text style={s.modalSection}>💰 Rent & Lease</Text>
          <Field label="Monthly Rent Amount (₹) *" value={form.rentAmount}      onChangeText={v=>set('rentAmount',v)}      placeholder="15000" keyboard="numeric" />
          <Field label="Security Deposit (₹)"      value={form.securityDeposit} onChangeText={v=>set('securityDeposit',v)} placeholder="30000" keyboard="numeric" />
          <Field label="Rent Due Date (day of month)" value={form.rentDueDate}  onChangeText={v=>set('rentDueDate',v)}     placeholder="1" keyboard="numeric" maxLength={2} />
          <Field label="Lease Start Date"           value={form.leaseStart}     onChangeText={v=>set('leaseStart',v)}      placeholder="DD-MM-YYYY" />
          <Field label="Lease End Date"             value={form.leaseEnd}       onChangeText={v=>set('leaseEnd',v)}        placeholder="DD-MM-YYYY" />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Add Tenant →</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Add Rent Record Modal ────────────────────────────────────
function AddRentModal({ visible, renter, onClose, onAdded }) {
  const [month, setMonth]   = useState(currentMonth());
  const [status, setStatus] = useState('paid');
  const [method, setMethod] = useState('UPI');
  const [paidOn, setPaidOn] = useState('');

  const [saving, setSaving] = useState(false);
  const METHODS = ['UPI','Cash','NEFT','Cheque','Other'];
  const STATUSES = ['paid','due','overdue'];

  const handleSave = async () => {
    setSaving(true);
    try {
      await addRentRecord({
        renterId:    renter.id,
        renterName:  renter.name,
        propertyId:  renter.propertyId,
        propertyName: renter.propertyName,
        customerId:  renter.customerId,
        unit:        renter.unit,
        amount:      renter.rentAmount,
        dueDate:     renter.rentDueDate,
        month,
        status,
      });
      if (status === 'paid') {
        // mark the just-added record as paid with method
        const records = await getRentByRenter(renter.id);
        const last = records[records.length - 1];
        if (last) await markRentPaid(last.id, method);
      }
      onAdded();
      onClose();
    } catch (e) {
      console.error('[CustomersScreen] addRentRecord failed:', e);
      Alert.alert('Error', 'Could not save the rent record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.modal}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.modalTitle}>Add Rent Record</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.modalSave}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.modalBody}>
          <Text style={s.modalNote}>{renter?.name} · ₹{renter?.rentAmount?.toLocaleString('en-IN')}/month</Text>

          <Field label="Month" value={month} onChangeText={setMonth} placeholder="May 2025" />

          <Text style={f.label}>Status</Text>
          <View style={s.chipRow}>
            {STATUSES.map(st => (
              <TouchableOpacity key={st} style={[s.chip, status===st && s.chipActive]} onPress={()=>setStatus(st)}>
                <Text style={[s.chipText, status===st && s.chipTextActive]}>
                  {st === 'paid' ? '✅ Paid' : st === 'due' ? '⏳ Due' : '🚨 Overdue'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {status === 'paid' && (
            <>
              <Text style={[f.label, {marginTop:14}]}>Payment Method</Text>
              <View style={s.chipRow}>
                {METHODS.map(m => (
                  <TouchableOpacity key={m} style={[s.chip, method===m && s.chipActive]} onPress={()=>setMethod(m)}>
                    <Text style={[s.chipText, method===m && s.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={[s.saveBtn, {marginTop:24}]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Rent Record →</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Tenant Detail ────────────────────────────────────────────
export function TenantDetail({ renter, onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddRent, setShowAddRent] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(null);
  const [payMethod, setPayMethod] = useState('UPI');

  const refresh = () => {
    getRentByRenter(renter.id)
      .then(setRecords)
      .catch(e => console.error('[CustomersScreen] getRentByRenter failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [renter.id]);

  const handleMarkPaid = async (id) => {
    try {
      await markRentPaid(id, payMethod);
      refresh();
    } catch (e) {
      console.error('[CustomersScreen] markRentPaid failed:', e);
      Alert.alert('Error', 'Could not mark rent as paid. Please try again.');
    } finally {
      setShowMarkPaid(null);
    }
  };

  const METHODS = ['UPI','Cash','NEFT','Cheque','Other'];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.detailHeader}>
        <TouchableOpacity onPress={onBack}><Text style={s.detailBack}>← Tenants</Text></TouchableOpacity>
        <Text style={s.detailTitle}>{renter.name}</Text>
        <Text style={s.detailSub}>{renter.unit ? `Unit ${renter.unit} · ` : ''}{renter.propertyName}</Text>
      </View>

      {/* Contact + Property Info */}
      <View style={s.card}>
        <Text style={s.cardTitle}>👤 Tenant Information</Text>
        {[
          { label: 'Mobile',           value: renter.mobile },
          { label: 'Email',            value: renter.email || '—' },
          { label: 'Rental Address',   value: renter.propertyAddress || renter.propertyName || '—' },
          { label: 'Unit / Flat',      value: renter.unit || '—' },
          { label: 'Monthly Rent',     value: `₹${(renter.rentAmount||0).toLocaleString('en-IN')}` },
          { label: 'Security Deposit', value: renter.securityDeposit ? `₹${Number(renter.securityDeposit).toLocaleString('en-IN')}` : '—' },
          { label: 'Rent Due',         value: renter.rentDueDate ? `${renter.rentDueDate}${getOrdinal(renter.rentDueDate)} of every month` : '—' },
          { label: 'Lease Start',      value: renter.leaseStart || '—' },
          { label: 'Lease End',        value: renter.leaseEnd   || '—' },
        ].map(row => (
          <View style={s.infoRow} key={row.label}>
            <Text style={s.infoLabel}>{row.label}</Text>
            <Text style={s.infoValue} numberOfLines={2}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Rent History */}
      <View style={s.section}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>💰 Rent History</Text>
          <TouchableOpacity style={s.addSmallBtn} onPress={() => setShowAddRent(true)}>
            <Text style={s.addSmallText}>+ Add Month</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={s.emptySmall}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {!loading && records.length === 0 && (
          <View style={s.emptySmall}>
            <Text style={s.emptySmallText}>No rent records yet.</Text>
            <TouchableOpacity style={s.addSmallBtn} onPress={() => setShowAddRent(true)}>
              <Text style={s.addSmallText}>+ Add First Record</Text>
            </TouchableOpacity>
          </View>
        )}

        {records.map(r => {
          const cfg = STATUS_CFG[r.status] || STATUS_CFG.due;
          return (
            <View key={r.id} style={[s.rentRow, { borderLeftColor: cfg.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rentMonth}>{r.month}</Text>
                {r.paidOn
                  ? <Text style={s.rentMeta}>Paid {r.paidOn} · {r.method}</Text>
                  : <Text style={[s.rentMeta, { color: theme.colors.danger }]}>
                      Due {r.dueDate}{getOrdinal(r.dueDate)} of month
                    </Text>
                }
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={s.rentAmt}>₹{(r.amount||0).toLocaleString('en-IN')}</Text>
                <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
                  <Text style={[s.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {r.status !== 'paid' && (
                  <TouchableOpacity style={s.markPaidBtn} onPress={() => setShowMarkPaid(r.id)}>
                    <Text style={s.markPaidText}>Mark Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Mark Paid method picker */}
      {showMarkPaid && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setShowMarkPaid(null)}>
          <View style={s.overlay}>
            <View style={s.overlayCard}>
              <Text style={s.overlayTitle}>Select Payment Method</Text>
              <View style={s.chipRow}>
                {METHODS.map(m => (
                  <TouchableOpacity key={m} style={[s.chip, payMethod===m && s.chipActive]} onPress={()=>setPayMethod(m)}>
                    <Text style={[s.chipText, payMethod===m && s.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection:'row', gap:10, marginTop:16 }}>
                <TouchableOpacity style={[s.saveBtn,{flex:1,paddingVertical:12}]} onPress={()=>handleMarkPaid(showMarkPaid)}>
                  <Text style={s.saveBtnText}>Confirm Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.cancelBtn,{flex:1}]} onPress={()=>setShowMarkPaid(null)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <AddRentModal
        visible={showAddRent}
        renter={renter}
        onClose={() => setShowAddRent(false)}
        onAdded={refresh}
      />
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ─── Customer Detail ──────────────────────────────────────────
function CustomerDetail({ customer, onBack }) {
  const [renters, setRenters]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [latestRent, setLatestRent] = useState({}); // renterId -> latest rent record
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);

  const refresh = () => {
    setLoading(true);
    getRentersByCustomer(customer.id)
      .then(async (rs) => {
        setRenters(rs);
        const entries = await Promise.all(
          rs.map(async r => [r.id, (await getRentByRenter(r.id))[0] || null])
        );
        setLatestRent(Object.fromEntries(entries));
      })
      .catch(e => console.error('[CustomersScreen] getRentersByCustomer failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [customer.id]);

  if (selectedRenter) {
    return (
      <TenantDetail
        renter={selectedRenter}
        onBack={() => setSelectedRenter(null)}
      />
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      {/* Header */}
      <View style={s.detailHeader}>
        <TouchableOpacity onPress={onBack}><Text style={s.detailBack}>← Customers</Text></TouchableOpacity>
        <Text style={s.detailTitle}>{customer.name}</Text>
        {customer.mobile ? <Text style={s.detailSub}>📞 {customer.mobile}</Text> : null}
        {customer.email  ? <Text style={s.detailSub}>✉️  {customer.email}</Text>  : null}
        {customer.address? <Text style={s.detailSub}>📍 {customer.address}</Text> : null}
      </View>

      <ScrollView>
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Tenants</Text>
            <TouchableOpacity style={s.addSmallBtn} onPress={() => setShowAddTenant(true)}>
              <Text style={s.addSmallText}>+ Add Tenant</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={s.emptyCard}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}

          {!loading && renters.length === 0 && (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🏠</Text>
              <Text style={s.emptyTitle}>No tenants yet</Text>
              <Text style={s.emptyDesc}>Add a tenant renting from {customer.name}.</Text>
              <TouchableOpacity style={s.saveBtn} onPress={() => setShowAddTenant(true)}>
                <Text style={s.saveBtnText}>Add First Tenant →</Text>
              </TouchableOpacity>
            </View>
          )}

          {renters.map(r => {
            const latest  = latestRent[r.id];
            const cfg     = latest ? (STATUS_CFG[latest.status] || STATUS_CFG.due) : null;
            return (
              <TouchableOpacity key={r.id} style={s.renterRow} onPress={() => setSelectedRenter(r)}>
                <View style={s.renterAvatar}>
                  <Text style={s.renterAvatarText}>{initials(r.name)}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.renterName}>{r.name}</Text>
                  <Text style={s.renterSub} numberOfLines={1}>
                    {r.propertyAddress || r.propertyName || '—'}
                  </Text>
                  <Text style={s.renterMeta}>📞 {r.mobile}</Text>
                  {r.unit ? <Text style={s.renterMeta}>Unit: {r.unit}</Text> : null}
                  <Text style={s.renterMeta}>
                    Lease: {r.leaseStart||'—'} → {r.leaseEnd||'—'}
                  </Text>
                  <Text style={s.renterMeta}>
                    Rent due: {r.rentDueDate}{getOrdinal(r.rentDueDate)} · Security: {r.securityDeposit ? `₹${Number(r.securityDeposit).toLocaleString('en-IN')}` : '—'}
                  </Text>
                </View>
                <View style={{ alignItems:'flex-end', gap:6 }}>
                  <Text style={s.renterRent}>₹{(r.rentAmount||0).toLocaleString('en-IN')}</Text>
                  {cfg && (
                    <View style={[s.statusPill,{backgroundColor:cfg.bg}]}>
                      <Text style={[s.statusPillText,{color:cfg.color}]}>{cfg.label}</Text>
                    </View>
                  )}
                  <Text style={s.renterArrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <AddTenantModal
        visible={showAddTenant}
        customer={customer}
        onClose={() => setShowAddTenant(false)}
        onAdded={() => { refresh(); setShowAddTenant(false); }}
      />
    </View>
  );
}

// ─── Main Customers Screen ────────────────────────────────────
export default function CustomersScreen() {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [renterCounts, setRenterCounts] = useState({}); // customerId -> count
  const [showAdd, setShowAdd]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');

  const refresh = () => {
    setLoading(true);
    getCustomers()
      .then(async (cs) => {
        setCustomers(cs);
        const entries = await Promise.all(
          cs.map(async c => [c.id, (await getRentersByCustomer(c.id)).length])
        );
        setRenterCounts(Object.fromEntries(entries));
      })
      .catch(e => console.error('[CustomersScreen] getCustomers failed:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile||'').includes(search) ||
    (c.email||'').toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return <CustomerDetail customer={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Customers</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          placeholder="🔍  Search customers..."
          placeholderTextColor={theme.colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView>
        {/* Loading state */}
        {loading && (
          <View style={s.emptyCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Empty state */}
        {!loading && customers.length === 0 && (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>👥</Text>
            <Text style={s.emptyTitle}>No customers yet</Text>
            <Text style={s.emptyDesc}>
              Add your first customer — a property owner whose tenants you manage.
            </Text>
            <TouchableOpacity style={s.saveBtn} onPress={() => setShowAdd(true)}>
              <Text style={s.saveBtnText}>+ Add First Customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.map(c => {
          const renterCount = renterCounts[c.id] || 0;
          return (
            <TouchableOpacity key={c.id} style={s.customerRow} onPress={() => setSelected(c)}>
              <View style={s.customerAvatar}>
                <Text style={s.customerAvatarText}>{initials(c.name)}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.customerName}>{c.name}</Text>
                <Text style={s.customerMeta}>📞 {c.mobile}</Text>
                {c.email ? <Text style={s.customerMeta}>✉️  {c.email}</Text> : null}
                <Text style={s.customerStats}>
                  {renterCount} tenant{renterCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 30 }} />
      </ScrollView>

      <AddCustomerModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => { refresh(); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },

  // Header
  header: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub: { color: '#90b8d8', fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: theme.colors.accent, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },

  // Search
  searchWrap: { padding: 16, paddingBottom: 8 },
  search: { backgroundColor: '#fff', borderRadius: 12, padding: 12, color: theme.colors.text, fontSize: 14, borderWidth: 1, borderColor: theme.colors.border },

  // Customer list row
  customerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: '#fff', marginHorizontal: 0 },
  customerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.primary + '20', borderWidth: 1.5, borderColor: theme.colors.primary + '50', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  customerAvatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },
  customerName: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  customerMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  customerStats: { fontSize: 11, color: theme.colors.primaryLight, marginTop: 4, fontWeight: '600' },
  arrow: { fontSize: 22, color: theme.colors.textLight, paddingLeft: 8 },

  // Detail header
  detailHeader: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  detailBack: { color: '#a0c0e0', fontSize: 14, marginBottom: 10 },
  detailTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  detailSub: { color: '#90b8d8', fontSize: 13, marginTop: 3 },

  // Section
  section: { padding: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  addSmallBtn: { backgroundColor: theme.colors.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  addSmallText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Renter row
  renterRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, ...theme.shadow },
  renterAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.primary + '15', borderWidth: 1.5, borderColor: theme.colors.primary + '30', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  renterAvatarText: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  renterName: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  renterSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  renterMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  renterRent: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  renterArrow: { fontSize: 18, color: theme.colors.textLight, marginTop: 4 },

  // Tenant detail
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 16, ...theme.shadow },
  cardTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel: { fontSize: 13, color: theme.colors.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: theme.colors.text, maxWidth: '55%', textAlign: 'right' },

  // Rent rows
  rentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, ...theme.shadow },
  rentMonth: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  rentMeta: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
  rentAmt: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  markPaidBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  markPaidText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Empty states
  emptyCard: { alignItems: 'center', padding: 36, margin: 16, backgroundColor: '#fff', borderRadius: 16, ...theme.shadow },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  emptyDesc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  emptySmall: { alignItems: 'center', paddingVertical: 20 },
  emptySmallText: { color: theme.colors.textLight, fontSize: 14, marginBottom: 12 },

  // Buttons
  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { backgroundColor: theme.colors.bg, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border },
  cancelBtnText: { color: theme.colors.textSecondary, fontWeight: '700', fontSize: 15 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: theme.colors.bg, borderWidth: 1.5, borderColor: theme.colors.border },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  // Modal
  modal: { flex: 1, backgroundColor: theme.colors.bg },
  modalHeader: { backgroundColor: theme.colors.primary, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCancel: { color: '#a0c0e0', fontSize: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  modalSave: { color: theme.colors.accent, fontSize: 14, fontWeight: '800' },
  modalBody: { padding: 20 },
  modalNote: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  modalSection: { fontSize: 13, fontWeight: '800', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },

  // Mark paid overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  overlayCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  overlayTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 14 },
});