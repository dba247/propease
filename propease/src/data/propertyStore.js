/**
 * propertyStore.js
 *
 * Persistent encrypted storage for customers, renters, rent records,
 * maintenance requests and work orders.
 *
 * Storage: localStorage (Snack/web) → persists across refreshes
 *          Module-level Map fallback → in-memory only
 * Encryption: XOR + base64 (pure JS, zero imports)
 *
 * All data is serialised to JSON, encrypted, and written to localStorage
 * on every mutation. On first access the store is hydrated from localStorage.
 */

// ── Storage engine (same as accountStore, zero imports) ───────
const ls = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('__pe_ps_test__', '1');
      window.localStorage.removeItem('__pe_ps_test__');
      return {
        get:    (k) => window.localStorage.getItem(k),
        set:    (k, v) => window.localStorage.setItem(k, v),
        remove: (k) => window.localStorage.removeItem(k),
      };
    }
  } catch (_) {}
  const m = new Map();
  return { get: k => m.get(k)||null, set: (k,v) => m.set(k,v), remove: k => m.delete(k) };
})();

// ── XOR cipher ────────────────────────────────────────────────
const EK = 'PropEase@2025#Property$Store!Key';
function enc(text) {
  try {
    let r = '';
    for (let i = 0; i < text.length; i++)
      r += String.fromCharCode(text.charCodeAt(i) ^ EK.charCodeAt(i % EK.length));
    return btoa(unescape(encodeURIComponent(r)));
  } catch (_) { return btoa(text); }
}
function dec(encoded) {
  try {
    const text = decodeURIComponent(escape(atob(encoded)));
    let r = '';
    for (let i = 0; i < text.length; i++)
      r += String.fromCharCode(text.charCodeAt(i) ^ EK.charCodeAt(i % EK.length));
    return r;
  } catch (_) { return null; }
}

// ── Persist helpers ───────────────────────────────────────────
const KEYS = {
  customers:    'pe_ps_customers',
  renters:      'pe_ps_renters',
  rentRecords:  'pe_ps_rent_records',
  maintenance:  'pe_ps_maintenance',
  workOrders:   'pe_ps_work_orders',
};

function load(key) {
  try {
    const raw = ls.get(key);
    if (raw) { const d = dec(raw); if (d) return JSON.parse(d); }
  } catch (_) {}
  return [];
}

function save(key, data) {
  try { ls.set(key, enc(JSON.stringify(data))); } catch (_) {}
}

// ── In-memory state (hydrated from localStorage on module load) ─
let customers   = load(KEYS.customers);
let renters     = load(KEYS.renters);
let rentRecords = load(KEYS.rentRecords);
let maintenanceRequests = load(KEYS.maintenance);
let workOrders  = load(KEYS.workOrders);

// ── Customers ─────────────────────────────────────────────────
export function getCustomers()        { return [...customers]; }
export function getCustomerById(id)   { return customers.find(c => c.id === id) || null; }

export function addCustomer(c) {
  const customer = { ...c, id: 'cust_' + Date.now() };
  customers.push(customer);
  save(KEYS.customers, customers);
  return customer;
}

// ── Properties (kept for backwards compat) ────────────────────
let properties = load('pe_ps_properties');

export function getProperties()               { return [...properties]; }
export function getPropertiesByCustomer(cid)  { return properties.filter(p => p.customerId === cid); }
export function getPropertyById(id)           { return properties.find(p => p.id === id) || null; }

export function addProperty(p) {
  const prop = { ...p, id: 'prop_' + Date.now() };
  properties.push(prop);
  save('pe_ps_properties', properties);
  return prop;
}

// ── Renters ───────────────────────────────────────────────────
export function getRenters()                  { return [...renters]; }
export function getRentersByProperty(pid)     { return renters.filter(r => r.propertyId === pid); }
export function getRentersByCustomer(cid)     { return renters.filter(r => r.customerId === cid); }
export function getRenterById(id)             { return renters.find(r => r.id === id) || null; }

export function addRenter(r) {
  const renter = { ...r, id: 'ren_' + Date.now() };
  renters.push(renter);
  save(KEYS.renters, renters);
  return renter;
}

export function updateRenter(id, updates) {
  renters = renters.map(r => r.id === id ? { ...r, ...updates } : r);
  save(KEYS.renters, renters);
}

// ── Rent records ──────────────────────────────────────────────
export function getRentRecords()          { return [...rentRecords]; }
export function getRentByRenter(rid)      { return rentRecords.filter(r => r.renterId === rid); }
export function getRentByProperty(pid)    { return rentRecords.filter(r => r.propertyId === pid); }

export function addRenter_autoRent(renter) {
  // Internal: auto-create first rent record when a renter is added
  rentRecords.push({
    id: 'rent_' + Date.now(),
    renterId:    renter.id,
    renterName:  renter.name,
    propertyId:  renter.propertyId,
    propertyName: renter.propertyName,
    customerId:  renter.customerId,
    unit:        renter.unit,
    amount:      renter.rentAmount,
    dueDate:     renter.rentDueDate,
    month:       new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    status:      'due',
    paidOn:      null,
    method:      null,
  });
  save(KEYS.rentRecords, rentRecords);
}

export function addRentRecord({ renterId, renterName, propertyId, propertyName,
  customerId, unit, amount, dueDate, month, status }) {
  rentRecords.push({
    id: 'rent_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    renterId, renterName, propertyId, propertyName, customerId,
    unit, amount, dueDate,
    month: month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    status: status || 'due',
    paidOn: null, method: null,
  });
  save(KEYS.rentRecords, rentRecords);
}

export function markRentPaid(id, method) {
  rentRecords = rentRecords.map(r =>
    r.id === id
      ? { ...r, status: 'paid', paidOn: new Date().toISOString().split('T')[0], method }
      : r
  );
  save(KEYS.rentRecords, rentRecords);
}

// ── Maintenance ───────────────────────────────────────────────
export function getMaintenanceRequests()      { return [...maintenanceRequests]; }
export function getMaintenanceByRenter(rid)   { return maintenanceRequests.filter(m => m.renterId === rid); }
export function getMaintenanceByProperty(pid) { return maintenanceRequests.filter(m => m.propertyId === pid); }

export function addMaintenanceRequest(req) {
  const m = { ...req, id: 'maint_' + Date.now(), status: 'open',
    reportedOn: new Date().toISOString().split('T')[0] };
  maintenanceRequests.unshift(m);
  save(KEYS.maintenance, maintenanceRequests);
  return m;
}

export function updateMaintenanceStatus(id, status) {
  maintenanceRequests = maintenanceRequests.map(m =>
    m.id === id ? { ...m, status } : m
  );
  save(KEYS.maintenance, maintenanceRequests);
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

export function getWorkOrders()               { return [...workOrders]; }
export function getWorkOrdersByProperty(pid)  { return workOrders.filter(w => w.propertyId === pid); }
export function getWorkOrdersByCustomer(cid)  { return workOrders.filter(w => w.customerId === cid); }

export function addWorkOrder(wo) {
  const order = {
    ...wo,
    id: 'wo_' + Date.now(),
    status: 'open',
    priority: wo.priority || 'Medium',
    createdOn: new Date().toISOString().split('T')[0],
    scheduledDate: wo.scheduledDate || null,
    completedOn: null,
    vendorName: wo.vendorName || '',
    vendorPhone: wo.vendorPhone || '',
    estimatedCost: wo.estimatedCost || '',
    actualCost: wo.actualCost || '',
    notes: wo.notes || '',
  };
  workOrders.unshift(order);
  save(KEYS.workOrders, workOrders);
  return order;
}

export function updateWorkOrder(id, updates) {
  workOrders = workOrders.map(w =>
    w.id === id ? {
      ...w, ...updates,
      completedOn: updates.status === 'completed'
        ? new Date().toISOString().split('T')[0]
        : w.completedOn,
    } : w
  );
  save(KEYS.workOrders, workOrders);
}