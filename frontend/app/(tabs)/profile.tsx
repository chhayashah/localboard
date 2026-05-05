import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/common/Avatar";
import RoleBadge from "../../components/common/RoleBadge";
import { formatCount, getRoleConfig } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { usersAPI } from "../../services/api";

const GRID = (Dimensions.get("window").width - 6) / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: me, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (me?._id) load();
  }, [me]);

  const load = async () => {
    try {
      const res: any = await usersAPI.getProfile(me._id);
      if (res.success) {
        setProfile(res.user);
        setPosts(res.posts);
        setStats(res.stats);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => logout();

  if (loading || !profile)
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const rc = getRoleConfig(profile.role);
  const filtered =
    activeTab === "reels" ? posts.filter((p) => p.type === "reel") : posts;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={[rc.color + "50", rc.color + "20", COLORS.bg]}
          style={{ height: 120 }}
        />

        {/* Top nav */}
        <View style={[styles.topNav, { top: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Profile info */}
        <View style={styles.info}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarBorder}>
              <Avatar user={profile} size={80} showBadge />
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push("/profile/edit")}
            >
              <Ionicons
                name="pencil-outline"
                size={14}
                color={COLORS.textPrimary}
              />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.handle}>
            @{profile.name?.toLowerCase().replace(/ /g, "")} ·{" "}
            {profile.location?.ward}
          </Text>
          <RoleBadge role={profile.role} size="lg" />
          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: "Posts", v: stats.posts },
              { label: "Followers", v: stats.followers },
              { label: "Following", v: stats.following },
            ].map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statNum}>{formatCount(s.v)}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {[
            { k: "posts", icon: "grid-outline" },
            { k: "reels", icon: "play-circle-outline" },
          ].map((t) => (
            <TouchableOpacity
              key={t.k}
              style={[styles.tab, activeTab === t.k && styles.tabActive]}
              onPress={() => setActiveTab(t.k)}
            >
              <Ionicons
                name={t.icon as any}
                size={22}
                color={activeTab === t.k ? COLORS.primary : COLORS.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {filtered.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={{ width: GRID, height: GRID }}
              onPress={() => router.push(`/post/${item._id}`)}
            >
              {item.mediaUrl ? (
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                />
              ) : (
                <View style={styles.textPost}>
                  <Text style={styles.textPostContent} numberOfLines={4}>
                    {item.content}
                  </Text>
                </View>
              )}
              {item.type === "reel" && (
                <View style={styles.reelIcon}>
                  <Ionicons name="play" size={11} color="#fff" />
                </View>
              )}
              <View style={styles.likesOverlay}>
                <Ionicons name="heart" size={10} color="#fff" />
                <Text style={styles.likesCount}>
                  {formatCount(item.likes?.length || 0)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyGrid}>
              <Text style={{ color: COLORS.textMuted }}>
                Koi post nahi abhi 🙂
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  topNav: {
    position: "absolute",
    right: 14,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { paddingHorizontal: 16, paddingBottom: 12, marginTop: -40 },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  avatarBorder: { padding: 3, borderRadius: 50, backgroundColor: COLORS.bg },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
  },
  editBtnText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: SIZES.body,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  handle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  bio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  stat: { alignItems: "center", gap: 2 },
  statNum: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: COLORS.primary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2, padding: 2 },
  textPost: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.bgCard,
    padding: 6,
    justifyContent: "center",
  },
  textPostContent: { fontSize: 10, color: COLORS.textSecondary },
  reelIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  likesOverlay: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  likesCount: { fontSize: 8, color: "#fff", fontWeight: "700" },
  emptyGrid: { width: "100%", padding: 40, alignItems: "center" },
});
