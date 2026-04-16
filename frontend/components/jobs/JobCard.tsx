import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import { timeAgo } from "../../constants/helpers";
import Avatar from "../common/Avatar";

const ICONS: Record<string, string> = {
  delivery: "🛵",
  cook: "👨‍🍳",
  cleaner: "🧹",
  security: "💂",
  driver: "🚗",
  teaching: "📚",
  medical: "🏥",
  retail: "🛒",
  construction: "🏗️",
  tech: "💻",
  other: "🔧",
};

export default function JobCard({ job, onPress }: any) {
  const call = () => Linking.openURL(`tel:${job.contactPhone}`);
  const whatsapp = () => {
    const msg = encodeURIComponent(
      `Hi! Maine LocalBoard pe "${job.title}" job dekhi.`,
    );
    Linking.openURL(
      `https://wa.me/91${job.whatsapp || job.contactPhone}?text=${msg}`,
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 22 }}>{ICONS[job.category] || "🔧"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.meta}>
            📍 {job.location.ward}, {job.location.city} ·{" "}
            {timeAgo(job.createdAt)}
          </Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>FREE</Text>
        </View>
      </View>

      <Text style={styles.desc} numberOfLines={2}>
        {job.description}
      </Text>

      {!!job.salary?.amount && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginBottom: 8,
          }}
        >
          <Ionicons name="cash-outline" size={14} color={COLORS.success} />
          <Text
            style={{ fontSize: 13, color: COLORS.success, fontWeight: "600" }}
          >
            ₹{job.salary.amount.toLocaleString("hi-IN")}/{job.salary.period}
            {job.salary.negotiable ? " (Negotiable)" : ""}
          </Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Avatar user={job.postedBy} size={24} showBadge={false} />
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
            {job.postedBy?.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.btn,
            { borderColor: "#25D36644", backgroundColor: "#25D36610" },
          ]}
          onPress={whatsapp}
        >
          <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
          <Text style={[styles.btnText, { color: "#25D366" }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.btn,
            {
              borderColor: COLORS.primary + "44",
              backgroundColor: COLORS.primary + "10",
            },
          ]}
          onPress={call}
        >
          <Ionicons name="call" size={15} color={COLORS.primary} />
          <Text style={[styles.btnText, { color: COLORS.primary }]}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: SIZES.bodyLg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  meta: { fontSize: 12, color: COLORS.textMuted },
  freeBadge: {
    backgroundColor: COLORS.success + "22",
    borderColor: COLORS.success + "44",
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  freeText: { color: COLORS.success, fontSize: 10, fontWeight: "700" },
  desc: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  btnText: { fontSize: 12, fontWeight: "600" },
});
