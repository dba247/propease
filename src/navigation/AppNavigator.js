// Auth helpers — screens import from here
// Actual state lives in App.js
import { Auth } from '../../App';

export function loginAsManager(user) { Auth.login && Auth.login({ role: 'manager', user }); }
export function loginAsOwner(user)   { Auth.login && Auth.login({ role: 'owner', user, customerId: user.customerId }); }
export function loginAsTenant(user)  { Auth.login && Auth.login({ role: 'tenant', user, renterId: user.renterId, customerId: user.customerId }); }
export function logout()             { Auth.logout && Auth.logout(); }
export function getCurrentUser()     { return Auth.user; }