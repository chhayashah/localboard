import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../../constants/theme";
import { postsAPI } from "../../services/api";
import Avatar from "../../components/common/Avatar";
import { formatCount, timeAgo } from "../../constants/helpers";
import { toast } from "../../components/common/Toast";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const IS_WEB = Platform.OS === "web";

// ─── Web Video Player ─────────────────────────────────────────
function WebVideo({
  uri,
  isActive,
  muted,
  paused,
}: {
  uri: string;
  isActive: boolean;
  muted: boolean;
  paused: boolean;
}) {
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && !paused) {
      videoRef.current.play?.().catch(() => {});
    } else {
      videoRef.current.pause?.();
    }
  }, [isActive, paused]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  return (
    <video
      ref={videoRef}
      src={uri}
      loop
      playsInline
      muted={muted}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        backgroundColor: "#000",
      }}
    />
  );
}

// ─── Native Video Player ──────────────────────────────────────
function NativeVideo({
  uri,
  isActive,
  muted,
  paused,
}: {
  uri: string;
  isActive: boolean;
  muted: boolean;
  paused: boolean;
}) {
  // Dynamic import to avoid web crash
  const [VideoComponent, setVideoComponent] = useState<any>(null);
  const [ResizeModeEnum, setResizeMode] = useState<any>(null);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    import("expo-av")
      .then(({ Video, ResizeMode }) => {
        setVideoComponent(() => Video);
        setResizeMode(() => ResizeMode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && !paused) videoRef.current.playAsync?.();
    else videoRef.current.pauseAsync?.();
  }, [isActive, paused]);

  if (!VideoComponent || !ResizeModeEnum) return null;

  return (
    <VideoComponent
      ref={videoRef}
      source={{ uri }}
      style={StyleSheet.absoluteFill}
      resizeMode={ResizeModeEnum.COVER}
      isLooping
      isMuted={muted}
      shouldPlay={isActive && !paused}
    />
  );
}

// ─── Single Reel Item ─────────────────────────────────────────
function ReelItem({ item, isActive }: { item: any; isActive: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(
    item.likeCount || item.likes?.length || 0,
  );
  const [muted, setMuted] = useState(true); // start muted for autoplay
  const [paused, setPaused] = useState(false);

  const isVideo = item.mediaType === "video" || item.type === "reel";

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((c: number) => (!liked ? c + 1 : c - 1));
    try {
      await postsAPI.likePost(item._id);
    } catch {}
  };

  const renderCaption = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#\w+|@\w+)/g);
    return (
      <Text style={styles.caption} numberOfLines={3}>
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
      {/* ── Background ── */}
      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={() => setPaused((p) => !p)}
      >
        {item.mediaUrl && isVideo ? (
          IS_WEB ? (
            <WebVideo
              uri={item.mediaUrl}
              isActive={isActive}
              muted={muted}
              paused={paused}
            />
          ) : (
            <NativeVideo
              uri={item.mediaUrl}
              isActive={isActive}
              muted={muted}
              paused={paused}
            />
          )
        ) : item.mediaUrl ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#0a0020", "#1a0840", "#300a15"]}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.centerWrap}>
              <Text style={{ fontSize: 72, opacity: 0.3 }}>🎬</Text>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Pause overlay */}
      {paused && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <View style={styles.pauseCircle}>
            <Ionicons name="pause" size={36} color="#fff" />
          </View>
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.wardPill}>
          <View style={styles.liveDot} />
          <Text style={styles.wardText}>
            📍 {item.user?.location?.ward || "Local"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.muteBtn}
          onPress={() => setMuted((m) => !m)}
        >
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={17}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ── Right Actions ── */}
      <View style={styles.rightCol}>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <View style={styles.avatarRing}>
            <Avatar user={item.user} size={42} showBadge={false} />
          </View>
          <View style={styles.followDot}>
            <Ionicons name="add" size={11} color="#000" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideAction} onPress={handleLike}>
          <View
            style={[
              styles.sideCircle,
              liked && { backgroundColor: "rgba(239,68,68,0.25)" },
            ]}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={27}
              color={liked ? COLORS.error : "#fff"}
            />
          </View>
          <Text style={styles.sideLabel}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideAction}
          onPress={() => router.push(`/post/${item._id}`)}
        >
          <View style={styles.sideCircle}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={25}
              color="#fff"
            />
          </View>
          <Text style={styles.sideLabel}>
            {formatCount(item.commentCount || item.comments?.length || 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideAction}>
          <View style={styles.sideCircle}>
            <Ionicons name="arrow-redo-outline" size={25} color="#fff" />
          </View>
          <Text style={styles.sideLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideAction}>
          <View style={styles.sideCircle}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Info ── */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.92)"]}
        style={styles.bottomGrad}
        pointerEvents="none"
      >
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <Text style={styles.userName}>
            @{item.user?.name?.toLowerCase().replace(/ /g, "") || "user"}
          </Text>
          <Text style={styles.dotSep}> · </Text>
          <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
        </TouchableOpacity>

        {!!item.content && renderCaption(item.content)}

        {item.hashtags?.length > 0 && (
          <View style={styles.hashRow}>
            {item.hashtags.slice(0, 3).map((h: string) => (
              <Text key={h} style={styles.hashtag}>
                {h}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.musicRow}>
          <View style={styles.musicIcon}>
            <Ionicons name="musical-note" size={11} color={COLORS.primary} />
          </View>
          <Text style={styles.musicText} numberOfLines={1}>
            Original Audio · {item.user?.name}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#07001a", "#120830", "#1a0a20"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.emptyInner}>
        <View style={styles.emptyIconRing}>
          <Ionicons name="videocam" size={44} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Reels Yet</Text>
        <Text style={styles.emptySub}>
          Be the first creator in your ward!{"\n"}Share what's happening around
          you.
        </Text>
        <TouchableOpacity style={styles.uploadCta} onPress={onUpload}>
          <Ionicons name="add-circle" size={20} color="#000" />
          <Text style={styles.uploadCtaText}>Create First Reel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function ReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res: any = await postsAPI.getReels(1);
      if (res.success) setReels(res.reels);
    } catch (e: any) {
      toast.error("Could not load reels.");
    } finally {
      setLoading(false);
    }
  };

  const onViewChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0] != null) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

  const UploadBtn = () => (
    <TouchableOpacity
      style={[styles.uploadFab, { top: insets.top + 12 }]}
      onPress={() => router.push("/create")}
    >
      <Ionicons name="add" size={22} color="#000" />
    </TouchableOpacity>
  );

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );

  if (reels.length === 0)
    return (
      <View style={{ flex: 1 }}>
        <EmptyState onUpload={() => router.push("/create")} />
        <UploadBtn />
      </View>
    );

  return (
    <View style={styles.container}>
      <UploadBtn />
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
        onViewableItemsChanged={onViewChange}
        viewabilityConfig={viewConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loader: {
    flex: 1,
    backgroundColor: "#07001a",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: COLORS.textMuted, fontSize: 14 },
  reelItem: { width: SCREEN_W, height: SCREEN_H, backgroundColor: "#000" },
  centerWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  pauseCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    zIndex: 10,
  },
  wardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  wardText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  muteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  rightCol: {
    position: "absolute",
    right: 10,
    bottom: 115,
    alignItems: "center",
    gap: 18,
    zIndex: 10,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: "hidden",
    marginBottom: 4,
  },
  followDot: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: [{ translateX: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  sideAction: { alignItems: "center", gap: 3 },
  sideCircle: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sideLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
  },
  bottomGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 85,
    paddingTop: 50,
    zIndex: 10,
  },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  userName: { fontSize: 14, fontWeight: "800", color: "#fff" },
  dotSep: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  timeAgo: { fontSize: 11, color: "rgba(255,255,255,0.45)" },
  caption: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 19,
    marginBottom: 7,
  },
  hashRow: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  hashtag: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  musicRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  musicIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(245,166,35,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  musicText: { fontSize: 12, color: "rgba(255,255,255,0.65)", flex: 1 },
  emptyWrap: { flex: 1 },
  emptyInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 14,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(245,166,35,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(245,166,35,0.3)",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  uploadCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    marginTop: 8,
  },
  uploadCtaText: { fontSize: 15, fontWeight: "800", color: "#000" },
  uploadFab: {
    position: "absolute",
    right: 14,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
});
