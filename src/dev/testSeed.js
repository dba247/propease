/**
 * src/dev/testSeed.js — DEVELOPMENT-ONLY SCAFFOLDING.
 *
 * Everything in src/dev/ is test-only tooling, never imported by real
 * app screens — only by the __DEV__-gated Quick Test block in
 * LandingScreen.js, which is stripped out of production builds
 * automatically (React Native sets __DEV__ to false in release/EAS
 * builds, so this code never runs or ships to real users).
 *
 * Safe to delete this whole src/dev/ folder at any time; nothing
 * outside of it depends on this file.
 *
 * Seeds one fixed test Customer (owner) + Renter (tenant) + rent
 * record, and their login accounts, so the 3 "Quick Test" buttons on
 * the Landing screen can jump straight into each role's real view
 * without typing credentials each time.
 *
 * Safe to call repeatedly — checks for existing docs by fixed ID
 * before creating anything, so it never duplicates data.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../data/firebaseConfig.js';
import { createOwnerAccount, createTenantAccount, findAccount } from '../data/accountStore.js';

const TEST_CUSTOMER_ID = 'dev_test_customer';
const TEST_RENTER_ID   = 'dev_test_renter';
const TEST_RENT_ID     = 'dev_test_rent_1';

const TEST_OWNER_EMAIL  = 'dev.owner@test.com';
const TEST_OWNER_PASS   = 'devtest123';
const TEST_TENANT_EMAIL = 'dev.tenant@test.com';
const TEST_TENANT_PASS  = 'devtest123';

/**
 * Ensures the test customer/renter/rent-record + login accounts exist,
 * then returns { managerAccount, ownerAccount, tenantAccount } ready to
 * pass straight into loginAsManager / loginAsOwner / loginAsTenant.
 */
export async function ensureDevTestData() {
  // 1. Test customer (owner)
  const custRef = doc(db, 'customers', TEST_CUSTOMER_ID);
  const custSnap = await getDoc(custRef);
  if (!custSnap.exists()) {
    await setDoc(custRef, {
      id: TEST_CUSTOMER_ID,
      name: 'TEST Property Owner',
      mobile: '9000000001',
      email: TEST_OWNER_EMAIL,
      address: '1 Test Owner Lane, Bengaluru',
    });
  }

  // 2. Test renter (tenant)
  const renterRef = doc(db, 'renters', TEST_RENTER_ID);
  const renterSnap = await getDoc(renterRef);
  if (!renterSnap.exists()) {
    await setDoc(renterRef, {
      id: TEST_RENTER_ID,
      name: 'TEST Tenant',
      mobile: '9000000002',
      email: TEST_TENANT_EMAIL,
      propertyAddress: '221B Test Street, Unit 4B, Bengaluru',
      propertyName: '221B Test Street',
      unit: '4B',
      rentAmount: 18000,
      securityDeposit: 36000,
      leaseStart: '2026-01-01',
      leaseEnd: '2026-12-31',
      rentDueDate: 5,
      customerId: TEST_CUSTOMER_ID,
      customerName: 'TEST Property Owner',
      propertyId: TEST_CUSTOMER_ID,
    });
  }

  // 3. A rent record (pending) so the "paid or pending" status has data to show
  const rentRef = doc(db, 'rentRecords', TEST_RENT_ID);
  const rentSnap = await getDoc(rentRef);
  if (!rentSnap.exists()) {
    await setDoc(rentRef, {
      id: TEST_RENT_ID,
      renterId: TEST_RENTER_ID,
      renterName: 'TEST Tenant',
      propertyId: TEST_CUSTOMER_ID,
      propertyName: '221B Test Street',
      customerId: TEST_CUSTOMER_ID,
      unit: '4B',
      amount: 18000,
      dueDate: 5,
      month: 'August 2026',
      status: 'due',
    });
  }

  // 4. Owner + tenant login accounts (idempotent via findAccount check)
  let ownerLookup = await findAccount({ loginMode: 'email', identifier: TEST_OWNER_EMAIL, password: TEST_OWNER_PASS });
  if (!ownerLookup.found) {
    const res = await createOwnerAccount({
      name: 'TEST Property Owner', mobile: '9000000001', countryCode: '+91',
      email: TEST_OWNER_EMAIL, password: TEST_OWNER_PASS, customerId: TEST_CUSTOMER_ID,
    });
    ownerLookup = { account: res.account };
  }

  let tenantLookup = await findAccount({ loginMode: 'email', identifier: TEST_TENANT_EMAIL, password: TEST_TENANT_PASS });
  if (!tenantLookup.found) {
    const res = await createTenantAccount({
      name: 'TEST Tenant', mobile: '9000000002', countryCode: '+91',
      email: TEST_TENANT_EMAIL, password: TEST_TENANT_PASS,
      renterId: TEST_RENTER_ID, customerId: TEST_CUSTOMER_ID,
    });
    tenantLookup = { account: res.account };
  }

  const managerLookup = await findAccount({ loginMode: 'email', identifier: 'propeasemgr@propease.in', password: 'admin123' });

  return {
    managerAccount: managerLookup.account,
    ownerAccount: ownerLookup.account,
    tenantAccount: tenantLookup.account,
  };
}
