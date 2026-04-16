export const COLORS = {
  bg: '#0A0A0F',
  bgCard: '#12121A',
  bgElevated: '#1A1A26',
  bgInput: '#1E1E2E',

  primary: '#FF6B2B',
  primaryLight: '#FF8C55',
  secondary: '#00D4AA',
  accent: '#7C3AED',

  textPrimary: '#F0F0F5',
  textSecondary: '#9090A8',
  textMuted: '#555570',

  roleUser: '#9090A8',
  roleReporter: '#3B82F6',
  roleMla: '#FF6B2B',
  roleParshad: '#10B981',
  roleOpposition: '#EF4444',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  border: '#1E1E2E',
  borderLight: '#2A2A3E',
};

export const SIZES = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  tiny: 10, caption: 12, body: 14, bodyLg: 16,
  title: 18, heading: 22, display: 28,
  radiusSm: 8, radiusMd: 12, radiusLg: 16, radiusXl: 24, radiusFull: 9999,
  screenPadding: 16,
};

export const ROLE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  user:       { label: 'Citizen',    color: '#9090A8', icon: 'person' },
  reporter:   { label: 'Reporter',   color: '#3B82F6', icon: 'newspaper' },
  mla:        { label: 'MLA',        color: '#FF6B2B', icon: 'business' },
  parshad:    { label: 'Parshad',    color: '#10B981', icon: 'shield-checkmark' },
  opposition: { label: 'Opposition', color: '#EF4444', icon: 'megaphone' },
};