import { ROLE_CONFIG } from './theme';

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'abhi';
  const m = Math.floor(seconds / 60);   if (m < 60)  return `${m}m`;
  const h = Math.floor(m / 60);         if (h < 24)  return `${h}h`;
  const d = Math.floor(h / 24);         if (d < 7)   return `${d}d`;
  return new Date(date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
};

export const formatCount = (num: number): string => {
  if (!num) return '0';
  if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr';
  if (num >= 100000)   return (num / 100000).toFixed(1) + ' L';
  if (num >= 1000)     return (num / 1000).toFixed(1) + 'K';
  return String(num);
};

export const getRoleConfig = (role: string) => ROLE_CONFIG[role] || ROLE_CONFIG.user;

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

export const getAvatarColor = (name = ''): string => {
  const colors = ['#FF6B2B','#3B82F6','#10B981','#7C3AED','#F59E0B','#EF4444','#EC4899','#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const isValidPhone = (phone: string): boolean => /^[6-9]\d{9}$/.test(phone);

export const parseContent = (text: string) => {
  if (!text) return [];
  const parts: { type: string; value: string }[] = [];
  const regex = /(#\w+|@\w+)/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex)
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    parts.push({ type: match[0].startsWith('#') ? 'hashtag' : 'mention', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', value: text.slice(lastIndex) });
  return parts;
};

export const JOB_CATEGORIES = [
  { value: 'all',          label: 'Sab Jobs' },
  { value: 'delivery',     label: '🛵 Delivery' },
  { value: 'cook',         label: '👨‍🍳 Cook/Khana' },
  { value: 'cleaner',      label: '🧹 Safai' },
  { value: 'security',     label: '💂 Security' },
  { value: 'driver',       label: '🚗 Driver' },
  { value: 'teaching',     label: '📚 Teaching' },
  { value: 'medical',      label: '🏥 Medical' },
  { value: 'retail',       label: '🛒 Dukan' },
  { value: 'construction', label: '🏗️ Construction' },
  { value: 'tech',         label: '💻 Tech' },
  { value: 'other',        label: '🔧 Other' },
];