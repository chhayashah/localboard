import { COLORS } from "./theme";

export const timeAgo = (date: string | Date): string => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "abhi abhi";
  if (diff < 3600) return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ghante pehle`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} din pehle`;
  return new Date(date).toLocaleDateString("hi-IN");
};

export const formatCount = (n: number): string => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const AVATAR_COLORS = [
  "#F5A623",
  "#FF6B2B",
  "#22C55E",
  "#38BDF8",
  "#A855F7",
  "#EF4444",
  "#16A085",
  "#D35400",
];

export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export type UserRole = "user" | "reporter" | "mla" | "parshad" | "opposition";

export const getRoleConfig = (role: string) => {
  const configs: Record<string, any> = {
    reporter: { label: "Reporter", color: COLORS.roleReporter, emoji: "📰" },
    mla: { label: "MLA", color: COLORS.roleMla, emoji: "🏛️" },
    parshad: { label: "Parshad", color: COLORS.roleParshad, emoji: "🏛️" },
    opposition: { label: "Vipaksh", color: COLORS.roleOpposition, emoji: "⚖️" },
    user: { label: "Creator", color: COLORS.roleUser, emoji: "✦" },
  };
  return configs[role] || configs.user;
};

export const isValidPhone = (p: string) => /^[6-9]\d{9}$/.test(p);
export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const JOB_CATEGORIES = [
  { value: "all", label: "Sabhi" },
  { value: "delivery", label: "🛵 Delivery" },
  { value: "cook", label: "👨‍🍳 Cook" },
  { value: "cleaner", label: "🧹 Cleaner" },
  { value: "security", label: "💂 Security" },
  { value: "driver", label: "🚗 Driver" },
  { value: "teaching", label: "📚 Teaching" },
  { value: "medical", label: "🏥 Medical" },
  { value: "retail", label: "🛒 Retail" },
  { value: "tech", label: "💻 Tech" },
  { value: "other", label: "🔧 Other" },
];

export const truncate = (text: string, len: number) =>
  text.length > len ? text.slice(0, len) + "..." : text;
