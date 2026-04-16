import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../../constants/theme";
import { usersAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../../components/common/Avatar";
import RoleBadge from "../../components/common/RoleBadge";
import { formatCount, getRoleConfig } from "../../constants/helpers";

const GRID = (Dimensions.get("window").width - 3) / 3;

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
    load();
  }, []);

  const load = async () => {
    try {
      const res: any = await usersAPI.getProfile(me!._id);
      if (res.success) {
        setProfile(res.user);
        setPosts(res.posts);
        setStats(res.stats);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Kya aap sure hain?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  if (loading || !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const rc = getRoleConfig(profile.role);
  const filtered =
    activeTab === "reels" ? posts.filter((p) => p.type === "reel") : posts;

  const Header = () => (
    <View>
      <LinearGradient
        colors={[rc.color + "30", COLORS.bg]}
        style={{ height: 130 }}
      />

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => router.push("/profile/edit")}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: SIZES.screenPadding }}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBorder}>
            <Avatar user={profile} size={80} />
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/profile/edit")}
          >
            <Text style={styles.editBtnText}>Profile Edit</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{profile.name}</Text>
        <RoleBadge role={profile.role} size="lg" />
        <Text style={styles.locationText}>
          📍 {profile.location.ward}, {profile.location.city}
        </Text>
        {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.statsRow}>
          {[
            { label: "Posts", v: stats.posts },
            { label: "Followers", v: stats.followers },
            { label: "Following", v: stats.following },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
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
              color={activeTab === t.k ? COLORS.primary : COLORS.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        numColumns={3}
        ListHeaderComponent={Header}
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
                <Text style={styles.textPostContent} numberOfLines={3}>
                  {item.content}
                </Text>
              </View>
            )}
            {item.type === "reel" && (
              <View style={styles.gridBadge}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: COLORS.textMuted }}>Abhi koi post nahi</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 1.5 }}
        ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
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
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: SIZES.screenPadding,
    zIndex: 10,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: -44,
  },
  avatarBorder: { padding: 3, borderRadius: 50, backgroundColor: COLORS.bg },
  editBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
  },
  editBtnText: { color: COLORS.textPrimary, fontWeight: "600", fontSize: 13 },
  name: {
    fontSize: SIZES.heading,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  locationText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  bio: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 6,
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
  statItem: { alignItems: "center", gap: 2 },
  statNum: {
    fontSize: SIZES.title,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
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
  textPostContent: { fontSize: 10, color: COLORS.textSecondary },
  gridBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
