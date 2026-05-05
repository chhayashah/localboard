import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatCount, timeAgo } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";
import { postsAPI } from "../../services/api";
import Avatar from "../common/Avatar";
import RoleBadge from "../common/RoleBadge";

export default function PostCard({ post, onLikeUpdate, compact = false }: any) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = async () => {
    const prev = liked;
    const prevC = likeCount;
    setLiked(!liked);
    setLikeCount((c: number) => (!liked ? c + 1 : c - 1));
    onLikeUpdate?.(post._id, !liked, !liked ? likeCount + 1 : likeCount - 1);
    try {
      await postsAPI.likePost(post._id);
    } catch {
      setLiked(prev);
      setLikeCount(prevC);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.content}\n\nLocalBoard pe dekho — Apna Sheher, Apni Awaaz`,
      });
      postsAPI.sharePost(post._id).catch(() => {});
    } catch {}
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(#\w+|@\w+)/g);
    return (
      <Text style={styles.caption}>
        {parts.map((p, i) =>
          p.startsWith("#") ? (
            <Text key={i} style={styles.hashtag}>
              {p}
            </Text>
          ) : p.startsWith("@") ? (
            <Text key={i} style={styles.mention}>
              {p}
            </Text>
          ) : (
            <Text key={i}>{p}</Text>
          ),
        )}
      </Text>
    );
  };

  const isNews = post.type === "news" || post.type === "update";
  const isVideo = post.mediaType === "video" || post.type === "reel";

  return (
    <TouchableOpacity
      style={[styles.card, isNews && styles.newsCard]}
      onPress={() => router.push(`/post/${post._id}`)}
      activeOpacity={0.92}
    >
      {isNews && (
        <View
          style={[
            styles.newsBanner,
            {
              backgroundColor:
                (post.type === "update"
                  ? COLORS.roleMla
                  : COLORS.roleReporter) + "15",
            },
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              {
                color:
                  post.type === "update" ? COLORS.roleMla : COLORS.roleReporter,
              },
            ]}
          >
            {post.type === "update" ? "🏛️ Official Update" : "📰 Local News"}
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${post.user?._id}`)}
        >
          <Avatar user={post.user} size={38} showBadge />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {post.user?.name}
              </Text>
              <RoleBadge role={post.user?.role} />
            </View>
            <Text style={styles.meta}>
              📍 {post.user?.location?.ward} · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Options", "", [
              { text: "Report", style: "destructive" },
              { text: "Cancel", style: "cancel" },
            ])
          }
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {post.mediaUrl && !compact && (
        <View style={styles.media}>
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.mediaImg}
            resizeMode="cover"
          />
          {isVideo && (
            <View style={styles.playBtn}>
              <Ionicons name="play" size={28} color="#fff" />
            </View>
          )}
          <View style={styles.mediaOverlay}>
            {isVideo && (
              <View style={styles.reelTag}>
                <Ionicons name="play" size={9} color="#000" />
                <Text style={styles.reelText}>REEL</Text>
              </View>
            )}
            <Text style={styles.viewCount}>
              👁 {formatCount(post.views || 0)}
            </Text>
          </View>
        </View>
      )}

      {!!post.content && (
        <View style={styles.body}>{renderContent(post.content)}</View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? COLORS.error : COLORS.textMuted}
          />
          <Text style={[styles.actionText, liked && { color: COLORS.error }]}>
            {formatCount(likeCount)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.action}
          onPress={() => router.push(`/post/${post._id}`)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={19}
            color={COLORS.textMuted}
          />
          <Text style={styles.actionText}>
            {formatCount(post.commentCount || 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleShare}>
          <Ionicons
            name="arrow-redo-outline"
            size={19}
            color={COLORS.textMuted}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity>
          <Ionicons
            name="bookmark-outline"
            size={19}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusLg,
    marginBottom: 10,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  newsCard: { borderColor: COLORS.roleReporter + "30" },
  newsBanner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bannerText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  name: {
    fontSize: SIZES.body,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  meta: { fontSize: SIZES.caption, color: COLORS.textMuted },
  media: { width: "100%", height: 200, position: "relative" },
  mediaImg: { width: "100%", height: "100%" },
  playBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaOverlay: {
    position: "absolute",
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  reelTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  reelText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.5,
  },
  viewCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  body: { paddingHorizontal: 12, paddingVertical: 8 },
  caption: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  hashtag: { color: COLORS.primary, fontWeight: "700" },
  mention: { color: COLORS.info, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 14,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: {
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
});
