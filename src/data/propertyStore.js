/**
 * propertyStore.js
 *
 * Property data storage backed by Firebase Firestore.
 * All reads/writes are async and synced across every device in real time.
 *
 * Collection layout:
 *   customers/         ← one doc per customer
 *   properties/        ← one doc per property
 *   renters/           ← one doc per renter/tenant
 *   rentRecords/       ← one doc per rent record
 *   maintenance/       ← one doc per maintenance request
 *   workOrders/        ← one doc per work order
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebaseConfig.js';

// ── Collection names ──────────────────────────────────────────
const COL = {
  customers:       'customers',
  properties:      'properties',
  renters:         'renters',
  rentRecords:     'rentRecords',
  maintenance:     'maintenance',
  workOrders:      'workOrders',
  contactRequests: 'contactRequests',
};

// ── Generic helpers ───────────────────────────────────────────
async function colAll(colName) {
  const snap = await getDocs(collection(db, colName));
  return snap.docs.map(d => d.data());
}

async function colWhere(colName, field, value) {
  const snap = await getDocs(query(collection(db, colName), where(field, '==', value)));
  return snap.docs.map(d => d.data());
}

async function writeDoc(colName, id, data) {
  await setDoc(doc(db, colName, id), data);
}

async function patchDoc(colName, id, updates) {
  await updateDoc(doc(db, colName, id), updates);
}

function newId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Customers ─────────────────────────────────────────────────

export async function getCustomers() {
  return colAll(COL.customers);
}

export async function getCustomerById(id) {
  const snap = await getDoc(doc(db, COL.customers, id));
  return snap.exists() ? snap.data() : null;
}

export async function addCustomer(c) {
  const customer = { ...c, id: newId('cust') };
  await writeDoc(COL.customers, customer.id, customer);
  return customer;
}

// ── Properties ────────────────────────────────────────────────

export async function getProperties() {
  return colAll(COL.properties);
}

export async function getPropertiesByCustomer(customerId) {
  return colWhere(COL.properties, 'customerId', customerId);
}

export async function getPropertyById(id) {
  const snap = await getDoc(doc(db, COL.properties, id));
  return snap.exists() ? snap.data() : null;
}

export async function addProperty(p) {
  const prop = { ...p, id: newId('prop') };
  await writeDoc(COL.properties, prop.id, prop);
  return prop;
}

// ── Renters / Tenants ─────────────────────────────────────────

export async function getRenters() {
  return colAll(COL.renters);
}

export async function getRentersByProperty(propertyId) {
  return colWhere(COL.renters, 'propertyId', propertyId);
}

export async function getRentersByCustomer(customerId) {
  return colWhere(COL.renters, 'customerId', customerId);
}

export async function getRenterById(id) {
  const snap = await getDoc(doc(db, COL.renters, id));
  return snap.exists() ? snap.data() : null;
}

export async function addRenter(r) {
  const renter = { ...r, id: newId('ren') };
  await writeDoc(COL.renters, renter.id, renter);
  // Auto-create the first rent record for this renter
  await _autoRentRecord(renter);
  return renter;
}

export async function updateRenter(id, updates) {
  await patchDoc(COL.renters, id, updates);
}

// ── Rent records ──────────────────────────────────────────────

async function _autoRentRecord(renter) {
  const record = {
    id:           newId('rent'),
    renterId:     renter.id,
    renterName:   renter.name,
    propertyId:   renter.propertyId,
    propertyName: renter.propertyName,
    customerId:   renter.customerId,
    unit:         renter.unit,
    amount:       renter.rentAmount,
    dueDate:      renter.rentDueDate,
    month:        new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    status:       'due',
    paidOn:       null,
    method:       null,
  };
  await writeDoc(COL.rentRecords, record.id, record);
}

export async function getRentRecords() {
  return colAll(COL.rentRecords);
}

export async function getRentByRenter(renterId) {
  return colWhere(COL.rentRecords, 'renterId', renterId);
}

export async function getRentByProperty(propertyId) {
  return colWhere(COL.rentRecords, 'propertyId', propertyId);
}

export async function addRentRecord({ renterId, renterName, propertyId, propertyName,
  customerId, unit, amount, dueDate, month, status }) {
  const record = {
    id: newId('rent'),
    renterId, renterName, propertyId, propertyName, customerId,
    unit, amount, dueDate,
    month:   month  || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    status:  status || 'due',
    paidOn:  null,
    method:  null,
  };
  await writeDoc(COL.rentRecords, record.id, record);
}

export async function markRentPaid(id, method) {
  await patchDoc(COL.rentRecords, id, {
    status: 'paid',
    paidOn: today(),
    method,
  });
}

// ── Maintenance ───────────────────────────────────────────────

export async function getMaintenanceRequests() {
  return colAll(COL.maintenance);
}

export async function getMaintenanceByRenter(renterId) {
  return colWhere(COL.maintenance, 'renterId', renterId);
}

export async function getMaintenanceByProperty(propertyId) {
  return colWhere(COL.maintenance, 'propertyId', propertyId);
}

export async function addMaintenanceRequest(req) {
  const m = {
    ...req,
    id:         newId('maint'),
    status:     'open',
    reportedOn: today(),
  };
  await writeDoc(COL.maintenance, m.id, m);
  return m;
}

export async function updateMaintenanceStatus(id, status) {
  await patchDoc(COL.maintenance, id, { status });
}

// ── Work Orders ───────────────────────────────────────────────

export const WO_CATEGORIES = [
  { label: 'Plumbing',     icon: '🚿' },
  { label: 'Electrical',   icon: '⚡' },
  { label: 'Carpentry',    icon: '🪚' },
  { label: 'Painting',     icon: '🎨' },
  { label: 'HVAC / AC',    icon: '❄️' },
  { label: 'Pest Control', icon: '🐛' },
  { label: 'Cleaning',     icon: '🧹' },
  { label: 'Security',     icon: '🔒' },
  { label: 'Other',        icon: '🔨' },
];

export async function getWorkOrders() {
  return colAll(COL.workOrders);
}

export async function getWorkOrdersByProperty(propertyId) {
  return colWhere(COL.workOrders, 'propertyId', propertyId);
}

export async function getWorkOrdersByCustomer(customerId) {
  return colWhere(COL.workOrders, 'customerId', customerId);
}

export async function addWorkOrder(wo) {
  const order = {
    ...wo,
    id:            newId('wo'),
    status:        'open',
    priority:      wo.priority      || 'Medium',
    createdOn:     today(),
    scheduledDate: wo.scheduledDate || null,
    completedOn:   null,
    vendorName:    wo.vendorName    || '',
    vendorPhone:   wo.vendorPhone   || '',
    estimatedCost: wo.estimatedCost || '',
    actualCost:    wo.actualCost    || '',
    notes:         wo.notes         || '',
  };
  await writeDoc(COL.workOrders, order.id, order);
  return order;
}

export async function updateWorkOrder(id, updates) {
  const patch = {
    ...updates,
    completedOn: updates.status === 'completed' ? today() : undefined,
  };
  // Don't write undefined fields to Firestore
  if (patch.completedOn === undefined) delete patch.completedOn;
  await patchDoc(COL.workOrders, id, patch);
}

// ── Contact / callback requests (from the public Contact Us page) ──
export async function getContactRequests() {
  return colAll(COL.contactRequests);
}

export async function addContactRequest({ name, mobile, message }) {
  const r = {
    id:          newId('contact'),
    name,
    mobile,
    message:     message || '',
    status:      'new', // 'new' | 'contacted'
    submittedOn: today(),
  };
  await writeDoc(COL.contactRequests, r.id, r);
  return r;
}

export async function markContactRequestContacted(id) {
  await patchDoc(COL.contactRequests, id, { status: 'contacted' });
}