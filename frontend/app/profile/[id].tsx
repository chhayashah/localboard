import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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

export default function PublicProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res: any = await usersAPI.getProfile(id);
      if (res.success) {
        setProfile(res.user);
        setPosts(res.posts);
        setStats(res.stats);
        setIsFollowing(res.isFollowing);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const res: any = await usersAPI.followUser(id);
      if (res.success) {
        setIsFollowing(res.isFollowing);
        setStats((s) => ({
          ...s,
          followers: res.isFollowing ? s.followers + 1 : s.followers - 1,
        }));
      }
    } catch {
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || !profile)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const isMe = profile._id === me?._id;
  const rc = getRoleConfig(profile.role);
  const filtered =
    activeTab === "reels" ? posts.filter((p) => p.type === "reel") : posts;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            <LinearGradient
              colors={[rc.color + "50", rc.color + "15", COLORS.bg]}
              style={{ height: 130 }}
            />
            <View style={styles.info}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarBorder}>
                  <Avatar user={profile} size={80} showBadge />
                </View>
                {isMe ? (
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push("/profile/edit")}
                  >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      isFollowing && styles.followingBtn,
                    ]}
                    onPress={handleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={isFollowing ? COLORS.textPrimary : "#000"}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.followText,
                          isFollowing && { color: COLORS.textPrimary },
                        ]}
                      >
                        {isFollowing ? "Following ✓" : "+ Follow"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.handle}>
                @{profile.name?.toLowerCase().replace(/ /g, "")} ·{" "}
                {profile.location?.ward}
              </Text>
              <RoleBadge role={profile.role} size="lg" />
              {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
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
                    color={
                      activeTab === t.k ? COLORS.primary : COLORS.textMuted
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
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
                <Text style={styles.textContent} numberOfLines={4}>
                  {item.content}
                </Text>
              </View>
            )}
            {item.type === "reel" && (
              <View style={styles.reelBadge}>
                <Ionicons name="play" size={11} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: COLORS.textMuted }}>Koi post nahi 🙂</Text>
          </View>
        }
        columnWrapperStyle={{ gap: 2 }}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
      />
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
  backBtn: {
    position: "absolute",
    left: 14,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
  },
  editBtnText: { color: COLORS.textPrimary, fontWeight: "600", fontSize: 13 },
  followBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: SIZES.radiusFull,
    minWidth: 100,
    alignItems: "center",
  },
  followingBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  followText: { color: "#000", fontWeight: "700", fontSize: 13 },
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
  textPost: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.bgCard,
    padding: 6,
    justifyContent: "center",
  },
  textContent: { fontSize: 10, color: COLORS.textSecondary },
  reelBadge: {
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
});
