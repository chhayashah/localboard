import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { usersAPI } from "../../services/api";
import Avatar from "../../components/common/Avatar";
import RoleBadge from "../../components/common/RoleBadge";
import { formatCount, getRoleConfig } from "../../constants/helpers";

const GRID_SIZE = (Dimensions.get("window").width - 4) / 3;

// ─── Grid Post Item ───────────────────────────────────────────
function GridItem({ item, onPress }: any) {
  return (
    <TouchableOpacity
      style={{ width: GRID_SIZE, height: GRID_SIZE }}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {item.mediaUrl ? (
        <Image
          source={{ uri: item.mediaUrl }}
          style={styles.gridImg}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.gridText}>
          <Text style={styles.gridTextContent} numberOfLines={5}>
            {item.content}
          </Text>
        </View>
      )}

      {/* Overlay info */}
      <View style={styles.gridOverlay}>
        {item.type === "reel" && (
          <View style={styles.reelBadge}>
            <Ionicons name="play" size={10} color="#fff" />
          </View>
        )}
        <View style={styles.gridLikes}>
          <Ionicons name="heart" size={10} color="#fff" />
          <Text style={styles.gridLikesText}>
            {formatCount(item.likes?.length || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Stat Item ────────────────────────────────────────────────
function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatCount(Number(value))}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: me, logout } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");

  useEffect(() => {
    if (me?._id) load();
  }, [me]);

  const load = async () => {
    try {
      const res: any = await usersAPI.getProfile(me._id);
      if (res.success) {
        setProfile(res.user);
        setPosts(res.posts || []);
        setStats(res.stats || { posts: 0, followers: 0, following: 0 });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile)
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const rc = getRoleConfig(profile.role);
  const filtered =
    activeTab === "reels" ? posts.filter((p) => p.type === "reel") : posts;
  const handle =
    "@" + (profile.name?.toLowerCase().replace(/ /g, "") || "user");

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
        {/* ── Banner ── */}
        <View style={styles.banner}>
          <LinearGradient
            colors={[rc.color + "60", rc.color + "25", COLORS.bg]}
            style={StyleSheet.absoluteFill}
          />
          {/* Top right actions */}
          <View style={[styles.bannerActions, { top: insets.top + 10 }]}>
            <TouchableOpacity
              style={styles.bannerBtn}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bannerBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Profile Info ── */}
        <View style={styles.infoSection}>
          {/* Avatar row */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarOuter}>
              <Avatar user={profile} size={78} showBadge />
            </View>

            <View style={styles.quickStats}>
              <StatItem value={stats.posts} label="Posts" />
              <View style={styles.statDivider} />
              <StatItem value={stats.followers} label="Followers" />
              <View style={styles.statDivider} />
              <StatItem value={stats.following} label="Following" />
            </View>
          </View>

          {/* Name + handle */}
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.name}</Text>
            {profile.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={COLORS.primary}
              />
            )}
          </View>
          <Text style={styles.handleText}>
            {handle} · {profile.location?.ward}, {profile.location?.city}
          </Text>

          {/* Role badge */}
          {profile.role !== "user" && (
            <View style={styles.roleBadgeWrap}>
              <RoleBadge role={profile.role} size="md" />
            </View>
          )}

          {/* Bio */}
          {!!profile.bio && <Text style={styles.bioText}>{profile.bio}</Text>}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => router.push("/profile/edit")}
            >
              <Ionicons
                name="pencil-outline"
                size={15}
                color={COLORS.textPrimary}
              />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons
                name="share-social-outline"
                size={15}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tab Bar (sticky) ── */}
        <View style={styles.tabBar}>
          {[
            { k: "posts", icon: "grid", label: "Posts" },
            { k: "reels", icon: "play-circle", label: "Reels" },
          ].map((t) => (
            <TouchableOpacity
              key={t.k}
              style={[styles.tab, activeTab === t.k && styles.tabActive]}
              onPress={() => setActiveTab(t.k as any)}
            >
              <Ionicons
                name={activeTab === t.k ? t.icon : (`${t.icon}-outline` as any)}
                size={20}
                color={activeTab === t.k ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === t.k && styles.tabLabelActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons
              name={
                activeTab === "reels" ? "videocam-outline" : "images-outline"
              }
              size={40}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyGridTitle}>
              {activeTab === "reels" ? "No Reels Yet" : "No Posts Yet"}
            </Text>
            <Text style={styles.emptyGridSub}>
              {activeTab === "reels"
                ? "Upload your first reel and go viral in your ward!"
                : "Share what's happening in your ward!"}
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push("/create")}
            >
              <Ionicons name="add" size={16} color="#000" />
              <Text style={styles.createBtnText}>
                {activeTab === "reels" ? "Upload Reel" : "Create Post"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item, index) => (
              <React.Fragment key={item._id}>
                <GridItem
                  item={item}
                  onPress={() => router.push(`/post/${item._id}`)}
                />
                {/* Gap between items */}
                {(index + 1) % 3 !== 0 && <View style={{ width: 2 }} />}
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  banner: { height: 130, position: "relative" },
  bannerActions: {
    position: "absolute",
    right: 14,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  bannerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -30,
  },
  avatarRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  avatarOuter: {
    padding: 3,
    borderRadius: 26,
    backgroundColor: COLORS.bg,
    marginRight: 16,
  },
  quickStats: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.border },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  displayName: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  handleText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 8 },
  roleBadgeWrap: { marginBottom: 8 },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: { flexDirection: "row", gap: 8 },
  editProfileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  shareBtn: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  tabLabelActive: { color: COLORS.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, padding: 2 },
  gridImg: { width: "100%", height: "100%" },
  gridText: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.bgCard,
    padding: 8,
    justifyContent: "center",
  },
  gridTextContent: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 5,
  },
  reelBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridLikes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridLikesText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  emptyGrid: { padding: 50, alignItems: "center", gap: 10 },
  emptyGridTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  emptyGridSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: SIZES.radiusFull,
    marginTop: 6,
  },
  createBtnText: { fontSize: 13, fontWeight: "800", color: "#000" },
});
