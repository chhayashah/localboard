import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../../constants/theme";
import { jobsAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { JOB_CATEGORIES, timeAgo, formatCount } from "../../constants/helpers";

const CAT_ICONS: Record<string, string> = {
  all: "🔍",
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

const CAT_COLORS: Record<string, string> = {
  all: COLORS.primary,
  delivery: "#FF6B2B",
  cook: "#F59E0B",
  cleaner: "#22C55E",
  security: "#6366F1",
  driver: "#38BDF8",
  teaching: "#A855F7",
  medical: "#EF4444",
  retail: "#14B8A6",
  construction: "#F97316",
  tech: "#3B82F6",
  other: "#6B7280",
};

// ─── Job Card ─────────────────────────────────────────────────
function JobCard({ job, onPress }: any) {
  const color = CAT_COLORS[job.category] || COLORS.primary;
  const icon = CAT_ICONS[job.category] || "🔧";
  const isNew =
    Date.now() - new Date(job.createdAt).getTime() < 24 * 60 * 60 * 1000;
  const isUrgent = job.title?.toLowerCase().includes("urgent");

  return (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: color }]} />

      <View style={styles.cardInner}>
        {/* Header */}
        <View style={styles.cardTop}>
          <View style={[styles.catIcon, { backgroundColor: color + "18" }]}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {job.title}
              </Text>
              {isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
            <Text style={styles.bizName} numberOfLines={1}>
              {job.postedBy?.name} · {job.location?.ward}
            </Text>
          </View>

          {job.salary?.amount > 0 && (
            <View style={styles.salaryWrap}>
              <Text style={[styles.salaryAmt, { color }]}>
                ₹{(job.salary.amount / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.salaryPer}>
                /
                {job.salary.period === "monthly"
                  ? "mo"
                  : job.salary.period === "daily"
                    ? "day"
                    : "hr"}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {!!job.description && (
          <Text style={styles.jobDesc} numberOfLines={2}>
            {job.description}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.footerChip}>
              <Ionicons
                name="location-outline"
                size={11}
                color={COLORS.textMuted}
              />
              <Text style={styles.footerChipText}>{job.location?.city}</Text>
            </View>
            <View style={styles.footerChip}>
              <Ionicons
                name="time-outline"
                size={11}
                color={COLORS.textMuted}
              />
              <Text style={styles.footerChipText}>
                {timeAgo(job.createdAt)}
              </Text>
            </View>
            {job.applicants > 0 && (
              <View style={styles.footerChip}>
                <Ionicons
                  name="people-outline"
                  size={11}
                  color={COLORS.textMuted}
                />
                <Text style={styles.footerChipText}>
                  {job.applicants} views
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.applyBtn,
              { backgroundColor: color + "18", borderColor: color + "40" },
            ]}
          >
            <Text style={[styles.applyBtnText, { color }]}>Apply →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Category Pill ────────────────────────────────────────────
function CatPill({ item, selected, onPress }: any) {
  const color = CAT_COLORS[item.value] || COLORS.primary;
  return (
    <TouchableOpacity
      style={[
        styles.catPill,
        selected && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text style={styles.catPillEmoji}>{CAT_ICONS[item.value]}</Text>
      <Text style={[styles.catPillText, selected && { color: "#fff" }]}>
        {item.label.replace(/^[^\w]*/, "")}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function JobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    load(true);
  }, [category]);

  const load = async (reset = false) => {
    try {
      const params: any = { limit: 20, page: 1 };
      if (category !== "all") params.category = category;
      const res: any = await jobsAPI.getJobs(params);
      if (res.success) setJobs(res.jobs);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = jobs.filter((j) =>
    search
      ? j.title?.toLowerCase().includes(search.toLowerCase()) ||
        j.description?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            <Text style={{ color: COLORS.textPrimary }}>Grow</Text>
            <Text style={{ color: COLORS.primary }}>Up</Text>
            <Text style={{ color: COLORS.textPrimary }}> Jobs</Text>
          </Text>
          <Text style={styles.headerSub}>
            {user?.location?.ward}, {user?.location?.city}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.postJobBtn}
          onPress={() => router.push("/jobs/create")}
        >
          <Ionicons name="add" size={18} color="#000" />
          <Text style={styles.postJobText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={17}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Stats Banner ── */}
      <View style={styles.statsBanner}>
        {[
          {
            label: "Open Jobs",
            value: jobs.length.toString(),
            icon: "briefcase-outline",
          },
          { label: "Categories", value: "10+", icon: "grid-outline" },
          { label: "Free Post", value: "100%", icon: "gift-outline" },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Ionicons name={s.icon as any} size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Categories ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {JOB_CATEGORIES.map((cat) => (
          <CatPill
            key={cat.value}
            item={cat}
            selected={category === cat.value}
            onPress={() => setCategory(cat.value)}
          />
        ))}
      </ScrollView>

      {/* ── Jobs List ── */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadText}>Finding jobs near you...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/jobs/${item._id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={36}
                  color={COLORS.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No results for "${search}"`
                  : "Be the first to post a job — it's free!"}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push("/jobs/create")}
                >
                  <Text style={styles.emptyBtnText}>Post a Job Free →</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  postJobBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: SIZES.radiusFull,
  },
  postJobText: { fontSize: 13, fontWeight: "800", color: "#000" },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  statsBanner: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  catRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  catPillEmoji: { fontSize: 14 },
  catPillText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  jobCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    flexDirection: "row",
  },
  accentBar: { width: 4, borderRadius: 0 },
  cardInner: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    marginBottom: 8,
  },
  catIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardMeta: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  newBadge: {
    backgroundColor: COLORS.success + "20",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.success + "40",
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  urgentBadge: {
    backgroundColor: COLORS.error + "18",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.error + "35",
  },
  urgentText: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.error,
    letterSpacing: 0.5,
  },
  bizName: { fontSize: 12, color: COLORS.textMuted },
  salaryWrap: { alignItems: "flex-end", flexShrink: 0 },
  salaryAmt: { fontSize: 16, fontWeight: "800" },
  salaryPer: { fontSize: 10, color: COLORS.textMuted },
  jobDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: { flexDirection: "row", gap: 8, flexWrap: "wrap", flex: 1 },
  footerChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  footerChipText: { fontSize: 10, color: COLORS.textMuted },
  applyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  applyBtnText: { fontSize: 12, fontWeight: "700" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  loadText: { fontSize: 13, color: COLORS.textMuted },
  empty: { padding: 50, alignItems: "center", gap: 10 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: SIZES.radiusFull,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "800", color: "#000" },
});
