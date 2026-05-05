import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/common/Avatar";
import { formatCount, timeAgo } from "../../constants/helpers";
import { COLORS } from "../../constants/theme";
import { postsAPI } from "../../services/api";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

function ReelItem({ item, isActive }: { item: any; isActive: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c: number) => (!liked ? c + 1 : c - 1));
    try {
      await postsAPI.likePost(item._id);
    } catch {}
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#\w+|@\w+)/g);
    return (
      <Text style={styles.caption}>
        {parts.map((p, i) =>
          p.startsWith("#") ? (
            <Text key={i} style={{ color: COLORS.primary, fontWeight: "700" }}>
              {p}
            </Text>
          ) : p.startsWith("@") ? (
            <Text key={i} style={{ color: COLORS.info, fontWeight: "700" }}>
              {p}
            </Text>
          ) : (
            <Text key={i}>{p}</Text>
          ),
        )}
      </Text>
    );
  };

  return (
    <View style={styles.reelItem}>
      {/* Background */}
      <View style={styles.reelBg}>
        <Text style={{ fontSize: 80, opacity: 0.18 }}>🎬</Text>
      </View>

      {/* Ward tag */}
      <View style={styles.wardTag}>
        <View style={styles.wardDot} />
        <Text style={styles.wardText}>📍 {item.user?.location?.ward}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, isActive && styles.progressActive]}
        />
      </View>

      {/* Right actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <Avatar user={item.user} size={42} showBadge />
          <View style={styles.followPill}>
            <Text style={styles.followText}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <View style={styles.actionCircle}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? COLORS.error : "#fff"}
            />
          </View>
          <Text style={styles.actionLabel}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/post/${item._id}`)}
        >
          <View style={styles.actionCircle}>
            <Ionicons name="chatbubble-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>
            {formatCount(item.commentCount || 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <Ionicons name="arrow-redo-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <Ionicons name="bookmark-outline" size={22} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <Text style={styles.userName}>
            @{item.user?.name?.toLowerCase().replace(/ /g, "")}
          </Text>
          <Text style={styles.userTime}> · {timeAgo(item.createdAt)}</Text>
        </TouchableOpacity>
        {!!item.content && renderContent(item.content)}
        <View style={styles.hashtagRow}>
          {(item.hashtags || []).slice(0, 3).map((h: string) => (
            <Text key={h} style={styles.hashtag}>
              {h}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const res: any = await postsAPI.getReels(1);
      if (res.success) setReels(res.reels);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onViewableChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index);
  }, []);

  if (loading)
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  if (reels.length === 0)
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 40 }}>🎬</Text>
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 15 }}>
          Koi reel nahi abhi
        </Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>
          Pehle reel upload karo!
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_H}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loader: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  reelItem: { width: SCREEN_W, height: SCREEN_H, position: "relative" },
  reelBg: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#0a0020",
    justifyContent: "center",
    alignItems: "center",
  },
  wardTag: {
    position: "absolute",
    top: 55,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245,166,35,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
  },
  wardDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  wardText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressFill: {
    height: "100%",
    width: "0%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressActive: { width: "45%" },
  rightActions: { position: "absolute", right: 12, bottom: 100, gap: 20 },
  actionBtn: { alignItems: "center", gap: 4 },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
  },
  actionLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },
  followPill: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  followText: { fontSize: 11, color: "#000", fontWeight: "900" },
  bottomInfo: { position: "absolute", bottom: 90, left: 14, right: 70 },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  userName: { fontSize: 13, fontWeight: "800", color: "#fff" },
  userTime: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  caption: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
    marginBottom: 7,
  },
  hashtagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  hashtag: { fontSize: 11, color: "rgba(245,166,35,0.9)", fontWeight: "700" },
});
