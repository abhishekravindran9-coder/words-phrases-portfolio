const KEY = 'mv_property_privacy';
export function isPrivacyMode() { return localStorage.getItem(KEY) === 'true'; }
export function togglePrivacyMode() { const next = !isPrivacyMode(); localStorage.setItem(KEY, String(next)); return next; }
export function maskMoney(value) { return isPrivacyMode() ? '₹••••••' : value; }
