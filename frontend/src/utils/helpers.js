/**
 * Formats a date string or Date object to a human-readable format.
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * Returns a relative time string (e.g. "2 days ago", "in 3 days").
 * @param {string|Date} date
 */
export function relativeDate(date) {
  if (!date) return '';
  const diff = Math.round((new Date(date) - new Date()) / 86_400_000);
  if (diff === 0)  return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1)  return 'Tomorrow';
  if (diff < 0)   return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

/**
 * Truncates a string to the given character limit, appending "…" if longer.
 */
export function truncate(str, limit = 80) {
  if (!str) return '';
  return str.length > limit ? str.slice(0, limit) + '…' : str;
}

/**
 * Capitalises the first letter of a string.
 */
export function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Returns a letter-based avatar background colour based on the first character of a string.
 */
export function avatarColor(name = '') {
  const colors = ['#4f46e5','#7c3aed','#db2777','#059669','#d97706','#0284c7'];
  const index  = name.charCodeAt(0) % colors.length;
  return colors[index];
}
