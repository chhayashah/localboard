import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../../constants/theme";
import { postsAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Avatar from "../../components/common/Avatar";
import { formatCount, timeAgo } from "../../constants/helpers";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

// ─── Single Reel Item ─────────────────────────────────────────
function ReelItem({ item, isActive }: { item: any; isActive: boolean }) {
  const router  = useRouter();
  const videoRef = useRef<Video>(null);
  const [liked,     setLiked]     = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.likeCount || item.likes?.length || 0);
  const [muted,     setMuted]     = useState(false);
  const [paused,    setPaused]    = useState(false);

  // Play/pause when active changes
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && !paused) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
    }
  }, [isActive, paused]);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c: number) => !liked ? c + 1 : c - 1);
    try { await postsAPI.likePost(item._id); } catch {}
  };

  const togglePause = () => setPaused((p) => !p);
  const toggleMute  = () => setMuted((m) => !m);

  const renderCaption = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#\w+|@\w+)/g);
    return (
      <Text style={styles.caption} numberOfLines={3}>
        {parts.map((p, i) =>
          p.startsWith("#") ? <Text key={i} style={{ color: COLORS.primary, fontWeight: "700" }}>{p}</Text>
          : p.startsWith("@") ? <Text key={i} style={{ color: COLORS.info, fontWeight: "700" }}>{p}</Text>
          : <Text key={i}>{p}</Text>
        )}
      </Text>
    );
  };

  return (
    <View style={styles.reelItem}>

      {/* ── Video / Image Background ── */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={togglePause}
      >
        {item.mediaUrl ? (
          item.mediaType === "video" || item.type === "reel" ? (
            <Video
              ref={videoRef}
              source={{ uri: item.mediaUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              isLooping
              isMuted={muted}
              shouldPlay={isActive && !paused}
            />
          ) : (
            // Image reel fallback
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0020" }]}>
              <View style={styles.imgPlaceholder}>
                <Text style={{ fontSize: 60 }}>🎬</Text>
              </View>
            </View>
          )
        ) : (
          <LinearGradient
            colors={["#0a0020", "#1a0840", "#300a15"]}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.imgPlaceholder}>
              <Text style={{ fontSize: 60, opacity: 0.4 }}>🎬</Text>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* ── Pause Icon ── */}
      {paused && (
        <View style={styles.pauseIcon}>
          <Ionicons name="pause" size={50} color="rgba(255,255,255,0.8)" />
        </View>
      )}

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.wardTag}>
          <View style={styles.wardDot} />
          <Text style={styles.wardText}>📍 {item.user?.location?.ward}</Text>
        </View>
        <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={18} color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ── Right Actions ── */}
      <View style={styles.rightActions}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <Avatar user={item.user} size={44} showBadge />
          <View style={styles.followPill}>
            <Ionicons name="add" size={12} color="#000" />
          </View>
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <View style={[styles.actionCircle, liked && { backgroundColor: COLORS.error + "30" }]}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? COLORS.error : "#fff"}
            />
          </View>
          <Text style={styles.actionLabel}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/post/${item._id}`)}
        >
          <View style={styles.actionCircle}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>
            {formatCount(item.commentCount || item.comments?.length || 0)}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <Ionicons name="arrow-redo-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Info ── */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.bottomGrad}
      >
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <Text style={styles.userName}>
            @{item.user?.name?.toLowerCase().replace(/ /g, "")}
          </Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
        </TouchableOpacity>

        {!!item.content && renderCaption(item.content)}

        {/* Hashtags */}
        {item.hashtags?.length > 0 && (
          <View style={styles.hashtagRow}>
            {item.hashtags.slice(0, 4).map((h: string) => (
              <Text key={h} style={styles.hashtag}>{h}</Text>
            ))}
          </View>
        )}

        {/* Music bar */}
        <View style={styles.musicBar}>
          <Ionicons name="musical-notes" size={13} color={COLORS.primary} />
          <Text style={styles.musicText} numberOfLines={1}>
            {item.user?.location?.city} Local Beat 🎵
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyReels({ onUpload }: { onUpload: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#0a0020", "#1a0840"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.emptyContent}>
        <Text style={styles.emptyEmoji}>🎬</Text>
        <Text style={styles.emptyTitle}>No Reels Yet</Text>
        <Text style={styles.emptySub}>
          Be the first to share a reel{"\n"}from your ward!
        </Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={onUpload}>
          <Ionicons name="videocam" size={18} color="#000" />
          <Text style={styles.uploadBtnText}>Upload First Reel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ReelsScreen() {
  const router       = useRouter();
  const insets       = useSafeAreaInsets();
  const { user }     = useAuth();
  const [reels,      setReels]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex,setActiveIndex]= useState(0);

  useEffect(() => { loadReels(); }, []);

  const loadReels = async () => {
    try {
      const res: any = await postsAPI.getReels(1);
      if (res.success) setReels(res.reels);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const onViewableChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0] != null) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

  const viewConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (loading) return (
    <View style={[styles.loader, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Loading reels...</Text>
    </View>
  );

  if (reels.length === 0) return (
    <View style={{ flex: 1 }}>
      <EmptyReels onUpload={() => router.push("/create")} />

      {/* Upload FAB */}
      <TouchableOpacity
        style={[styles.fab, { top: insets.top + 10 }]}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Upload button */}
      <TouchableOpacity
        style={[styles.fab, { top: insets.top + 10 }]}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add" size={22} color="#000" />
      </TouchableOpacity>

      <FlatList
        data={reels}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableChanged}
        viewabilityConfig={viewConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadReels(); }}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  loader:       { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  reelItem:     { width: SCREEN_W, height: SCREEN_H, position: "relative", backgroundColor: "#000" },
  imgPlaceholder:{ flex: 1, justifyContent: "center", alignItems: "center" },
  pauseIcon:    { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -30 }, { translateY: -30 }], zIndex: 10 },
  topBar:       { position: "absolute", top: 55, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14 },
  wardTag:      { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(245,166,35,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "rgba(245,166,35,0.3)" },
  wardDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  wardText:     { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  muteBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  rightActions: { position: "absolute", right: 12, bottom: 120, gap: 20, alignItems: "center" },
  avatarWrap:   { position: "relative", marginBottom: 4 },
  followPill:   { position: "absolute", bottom: -6, left: "50%", transform: [{ translateX: -10 }], width: 20, height: 20, backgroundColor: COLORS.primary, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "#000" },
  actionBtn:    { alignItems: "center", gap: 4 },
  actionCircle: { width: 46, height: 46, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionLabel:  { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "700" },
  bottomGrad:   { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 90, paddingTop: 40 },
  userRow:      { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  userName:     { fontSize: 14, fontWeight: "800", color: "#fff" },
  dot:          { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  timeText:     { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  caption:      { fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 19, marginBottom: 8 },
  hashtagRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  hashtag:      { fontSize: 12, color: "rgba(245,166,35,0.9)", fontWeight: "700" },
  musicBar:     { flexDirection: "row", alignItems: "center", gap: 6 },
  musicText:    { fontSize: 12, color: "rgba(255,255,255,0.7)", flex: 1 },
  emptyWrap:    { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContent: { alignItems: "center", gap: 12, padding: 32 },
  emptyEmoji:   { fontSize: 64, marginBottom: 8 },
  emptyTitle:   { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  emptySub:     { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 22 },
  uploadBtn:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: SIZES.radiusFull, marginTop: 8 },
  uploadBtnText:{ fontSize: 15, fontWeight: "800", color: "#000" },
  fab:          { position: "absolute", right: 14, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});