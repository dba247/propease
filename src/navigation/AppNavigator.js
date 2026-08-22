// Auth helpers — screens import from here
// Actual state lives in App.js
import { Auth } from '../../App';

export function loginAsManager(user)  { Auth.login && Auth.login({ role: 'manager', user }); }
export function loginAsCustomer(rid)  { Auth.login && Auth.login({ role: 'customer', renterId: rid }); }
export function logout()              { Auth.logout && Auth.logout(); }
export function getCurrentUser()      { return Auth.user; }