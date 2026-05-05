import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { timeAgo } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";

const CAT_ICONS: Record<string, string> = {
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
  const icon = CAT_ICONS[job.category] || "🔧";
  const isUrgent =
    Date.now() - new Date(job.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.biz}>
            {job.postedBy?.name} · {job.location?.ward}
          </Text>
        </View>
        {job.salary?.amount > 0 && (
          <Text style={styles.salary}>
            ₹{job.salary.amount.toLocaleString("hi-IN")}/
            {job.salary.period === "monthly"
              ? "mo"
              : job.salary.period === "daily"
                ? "day"
                : "hr"}
          </Text>
        )}
      </View>

      {!!job.description && (
        <Text style={styles.desc} numberOfLines={2}>
          {job.description}
        </Text>
      )}

      <View style={styles.footer}>
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <View style={styles.urgentDot} />
            <Text style={styles.urgentText}>Urgent</Text>
          </View>
        )}
        <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
        <Text style={styles.dist}>
          {job.location?.ward}, {job.location?.city}
        </Text>
        <Text style={styles.time}>{timeAgo(job.createdAt)}</Text>
        <View style={styles.applyBtn}>
          <Text style={styles.applyText}>Apply →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.bgInput,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  title: {
    fontSize: SIZES.body,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 19,
    marginBottom: 2,
  },
  biz: { fontSize: SIZES.caption, color: COLORS.textMuted },
  salary: {
    fontSize: SIZES.body,
    fontWeight: "800",
    color: COLORS.primary,
    flexShrink: 0,
  },
  desc: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.error + "15",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  urgentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  urgentText: { fontSize: 10, color: COLORS.error, fontWeight: "700" },
  dist: { fontSize: 10, color: COLORS.textMuted, flex: 1 },
  time: { fontSize: 10, color: COLORS.textMuted },
  applyBtn: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primary + "35",
  },
  applyText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
});
