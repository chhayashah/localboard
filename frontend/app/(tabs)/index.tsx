import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/common/Avatar";
import PostCard from "../../components/feed/PostCard";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { postsAPI } from "../../services/api";

const TABS = ["Sabka", "Local", "Reels", "Awaaz"];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    load(true);
  }, [activeTab]);

  const load = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      const typeMap: Record<number, string> = { 2: "reel", 3: "news" };
      const params: any = { page: reset ? 1 : page, limit: 10 };
      if (typeMap[activeTab]) params.type = typeMap[activeTab];
      const res: any = await postsAPI.getFeed(params);
      if (res.success) {
        setPosts(reset ? res.posts : (p) => [...p, ...res.posts]);
        setHasMore(res.pagination.hasMore);
        if (!reset) setPage((p) => p + 1);
        else setPage(2);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const onEndReached = () => {
    if (hasMore && !loading) load();
  };

  const handleLikeUpdate = useCallback(
    (id: string, isLiked: boolean, likeCount: number) => {
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isLiked, likeCount } : p)),
      );
    },
    [],
  );

  const Stories = () => (
    <View style={styles.storiesRow}>
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => router.push("/create")}
      >
        <View style={[styles.storyRing, styles.addStory]}>
          <Avatar user={user} size={46} />
          <View style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </View>
        </View>
        <Text style={styles.storyName}>Teri</Text>
      </TouchableOpacity>
      {[
        { emoji: "😂", name: "Rohit" },
        { emoji: "📰", name: "Reporter" },
        { emoji: "🏛️", name: "MLA Ji" },
        { emoji: "📸", name: "Priya" },
      ].map((s, i) => (
        <TouchableOpacity key={i} style={styles.storyItem}>
          <View
            style={[
              styles.storyRing,
              i < 3 && styles.storyUnseen,
              i === 2 && styles.storySeen,
            ]}
          >
            <View style={styles.storyInner}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
            </View>
          </View>
          <Text style={styles.storyName}>{s.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const Header = () => (
    <View>
      <View style={styles.wardLive}>
        <View style={styles.liveDot} />
        <Text style={styles.liveLabel}>Live {user?.location?.ward}</Text>
        <Text style={styles.liveCount}>· 284 online</Text>
      </View>
      <View style={styles.feedTabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity
            key={i}
            style={styles.ftab}
            onPress={() => {
              if (i === 2) {
                router.push("/reels");
                return;
              }
              setActiveTab(i);
            }}
          >
            <Text
              style={[styles.ftabText, activeTab === i && styles.ftabActive]}
            >
              {t}
            </Text>
            {activeTab === i && <View style={styles.ftabBar} />}
          </TouchableOpacity>
        ))}
      </View>
      {/* Democracy Strip */}
      <TouchableOpacity style={styles.demStrip}>
        <Text style={{ fontSize: 22 }}>🏛️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.demTitle}>Ward ki nayi khabar</Text>
          <Text style={styles.demSub}>MLA + Reporter + Vipaksh — updates</Text>
        </View>
        <Text style={{ color: COLORS.info, fontSize: 18 }}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* App Header */}
      <View style={styles.appHdr}>
        <Text style={styles.wordmark}>
          <Text style={{ color: COLORS.textPrimary }}>Local</Text>
          <Text style={{ color: COLORS.primary }}>Board</Text>
        </Text>
        <View style={styles.hdrIcons}>
          <TouchableOpacity
            style={styles.hic}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={19}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hic}>
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Bar */}
      <TouchableOpacity style={styles.locBar}>
        <View style={styles.locDot} />
        <Text style={styles.locText}>
          {user?.location?.ward} · {user?.location?.city}
        </Text>
        <Text style={styles.locChg}>Badlo ▾</Text>
      </TouchableOpacity>

      <Stories />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={Header}
          renderItem={({ item }) => (
            <PostCard post={item} onLikeUpdate={handleLikeUpdate} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ padding: 20 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: COLORS.textMuted }}>
                Koi post nahi — pehle post karo! 🏙️
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/create")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  appHdr: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  wordmark: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  hdrIcons: { flexDirection: "row", gap: 8 },
  hic: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.bgCard,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  locBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: COLORS.bgInput,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.primary + "35",
    gap: 8,
  },
  locDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  locText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  locChg: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  storiesRow: {
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  storyItem: { alignItems: "center", gap: 4 },
  storyRing: { width: 54, height: 54, borderRadius: 17, padding: 2.5 },
  storyInner: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  storyUnseen: { backgroundColor: COLORS.primary },
  storySeen: { backgroundColor: "rgba(255,255,255,0.18)" },
  addStory: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.primary + "60",
    position: "relative",
  },
  addBtn: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  addBtnText: { fontSize: 13, color: "#000", fontWeight: "900" },
  storyName: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: "600",
    maxWidth: 54,
    textAlign: "center",
  },
  wardLive: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  liveLabel: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  liveCount: { fontSize: 9.5, color: COLORS.primary, fontWeight: "700" },
  feedTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 14,
  },
  ftab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    position: "relative",
  },
  ftabText: { fontSize: 10.5, fontWeight: "700", color: COLORS.textMuted },
  ftabActive: { color: COLORS.textPrimary },
  ftabBar: {
    position: "absolute",
    bottom: -1,
    width: 22,
    height: 2.5,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  demStrip: {
    margin: 10,
    backgroundColor: COLORS.info + "0D",
    borderWidth: 1,
    borderColor: COLORS.info + "30",
    borderRadius: 16,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  demTitle: { fontSize: 11.5, fontWeight: "700", color: COLORS.textPrimary },
  demSub: { fontSize: 9.5, color: COLORS.textMuted, marginTop: 2 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { padding: 40, alignItems: "center" },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { fontSize: 28, color: "#000", fontWeight: "900", lineHeight: 32 },
});
