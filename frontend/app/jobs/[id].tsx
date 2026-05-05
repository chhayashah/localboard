import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/common/Avatar";
import { timeAgo } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";
import { jobsAPI } from "../../services/api";

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

export default function JobDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res: any = await jobsAPI.getJob(id);
      if (res.success) setJob(res.job);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => Linking.openURL(`tel:${job.contactPhone}`);
  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Namaste! Maine LocalBoard pe aapki job post dekhi — "${job.title}". Kya yeh abhi available hai?`,
    );
    Linking.openURL(
      `https://wa.me/91${job.whatsapp || job.contactPhone}?text=${msg}`,
    );
  };

  if (loading || !job)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const icon = CAT_ICONS[job.category] || "🔧";

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[styles.nav, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Job Detail</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={{ fontSize: 36 }}>{icon}</Text>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.postedBy}>
            {job.postedBy?.name} · {job.location?.ward}, {job.location?.city}
          </Text>
          {job.salary?.amount > 0 && (
            <View style={styles.salaryBadge}>
              <Text style={styles.salaryText}>
                ₹{job.salary.amount.toLocaleString("hi-IN")}/
                {job.salary.period === "monthly"
                  ? "mahina"
                  : job.salary.period === "daily"
                    ? "din"
                    : "ghanta"}
                {job.salary.negotiable ? " (negotiable)" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Info cards */}
        {[
          {
            icon: "location-outline",
            label: "Location",
            value: `${job.location?.ward}, ${job.location?.city} — ${job.location?.pincode}`,
          },
          {
            icon: "briefcase-outline",
            label: "Category",
            value: `${icon} ${job.category}`,
          },
          {
            icon: "time-outline",
            label: "Posted",
            value: timeAgo(job.createdAt),
          },
          {
            icon: "people-outline",
            label: "Applicants",
            value: `${job.applicants} logon ne dekha`,
          },
        ].map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Ionicons name={row.icon as any} size={18} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>Job Description</Text>
          <Text style={styles.descText}>{job.description}</Text>
        </View>

        {/* Posted by */}
        <View style={styles.posterCard}>
          <Avatar user={job.postedBy} size={44} showBadge />
          <View style={{ flex: 1 }}>
            <Text style={styles.posterName}>{job.postedBy?.name}</Text>
            <Text style={styles.posterLocation}>
              📍 {job.postedBy?.location?.ward}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => router.push(`/profile/${job.postedBy?._id}`)}
          >
            <Text style={styles.viewProfileText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CTA buttons */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
          <Text style={{ fontSize: 18 }}>💬</Text>
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Ionicons name="call" size={18} color="#000" />
          <Text style={styles.callText}>Call Karo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  scroll: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 20, paddingVertical: 20 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  postedBy: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  salaryBadge: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.primary + "35",
  },
  salaryText: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textTransform: "capitalize",
  },
  descCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  descText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  posterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  posterName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  posterLocation: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  viewProfileBtn: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  ctaBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#25D366" + "20",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#25D366" + "40",
  },
  whatsappText: { fontSize: 15, fontWeight: "800", color: "#25D366" },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  callText: { fontSize: 15, fontWeight: "800", color: "#000" },
});
