export const API_BASE_URL = '/api';

export const ROUTES = {
  LOGIN:     '/login',
  REGISTER:  '/register',
  DASHBOARD: '/dashboard',
  WORDS:     '/words',
  REVIEW:    '/review',
  PROGRESS:  '/progress',
  JOURNAL:   '/journal',
  PROFILE:   '/profile',
};

export const QUALITY_LABELS = {
  0: 'Blackout 😶',
  1: 'Wrong',
  2: 'Wrong, but recalled',
  3: 'Hard ✓',
  4: 'Good ✓',
  5: 'Easy ✓✓',
};

export const MOOD_OPTIONS = [
  { value: 'excited',    label: '🤩 Excited'    },
  { value: 'happy',      label: '😊 Happy'      },
  { value: 'motivated',  label: '💪 Motivated'  },
  { value: 'neutral',    label: '😐 Neutral'    },
  { value: 'challenged', label: '🤔 Challenged'  },
  { value: 'tired',      label: '😴 Tired'      },
];

export const CATEGORY_COLORS = [
  '#4f46e5','#7c3aed','#db2777','#dc2626',
  '#d97706','#059669','#0284c7','#0891b2',
];
