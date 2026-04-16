import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../../constants/theme";
import { postsAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import PostCard from "../../components/feed/PostCard";
import { connectSocket } from "../../services/socket";

const FILTERS = [
  { label: "Sab", value: "" },
  { label: "📰 News", value: "news" },
  { label: "🔄 Update", value: "update" },
  { label: "🎬 Reels", value: "reel" },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState("");
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user._id, user.location.ward);
    socket.on("post_created", (p: any) => setPosts((prev) => [p, ...prev]));
    socket.on("notification", () => setNotifCount((n) => n + 1));
  }, [user]);

  const fetchPosts = useCallback(
    async (pageNum = 1, refresh = false) => {
      try {
        const res: any = await postsAPI.getFeed({
          page: pageNum,
          limit: 10,
          type: filter || undefined,
        });
        if (res.success) {
          if (refresh || pageNum === 1) setPosts(res.posts);
          else setPosts((prev) => [...prev, ...res.posts]);
          setHasMore(res.pagination.hasMore);
          setPage(pageNum);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [filter],
  );

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, true).finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1, true);
    setRefreshing(false);
  };
  const onMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(page + 1);
    setLoadingMore(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>LocalBoard</Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/search")}
          >
            <Ionicons name="search" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              router.push("/notifications");
              setNotifCount(0);
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={COLORS.textSecondary}
            />
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Location bar */}
      <View style={styles.locBar}>
        <Ionicons name="location" size={13} color={COLORS.primary} />
        <Text style={styles.locText}>
          {user?.location?.ward}, {user?.location?.city}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.chipText,
                filter === f.value && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>
            Ward ke posts load ho rahe hain...
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLikeUpdate={(id: string, isLiked: boolean, likeCount: number) =>
                setPosts((p) =>
                  p.map((x) =>
                    x._id === id ? { ...x, isLiked, likeCount } : x,
                  ),
                )
              }
              onPress={(p: any) => router.push(`/post/${p._id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🏙️</Text>
              <Text style={styles.emptyTitle}>Abhi koi post nahi</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/create")}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Pehle Post Karein!
                </Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ padding: 20 }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={onMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: { fontSize: SIZES.heading, fontWeight: "800", color: COLORS.primary },
  iconBtn: { padding: 8, position: "relative" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontSize: 9, color: "#fff", fontWeight: "700" },
  locBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 8,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locText: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  liveText: { fontSize: 11, color: COLORS.error, fontWeight: "600" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { padding: 40, alignItems: "center", gap: 12 },
  emptyTitle: {
    fontSize: SIZES.title,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: SIZES.radiusFull,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
