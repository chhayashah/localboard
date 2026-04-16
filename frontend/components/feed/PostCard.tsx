import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../../constants/theme";
import {
  timeAgo,
  formatCount,
  parseContent,
  getRoleConfig,
} from "../../constants/helpers";
import Avatar from "../common/Avatar";
import RoleBadge from "../common/RoleBadge";
import { postsAPI } from "../../services/api";

const SW = Dimensions.get("window").width;

export default function PostCard({ post, onLikeUpdate, onPress }: any) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post.likes?.length || 0,
  );

  const handleLike = useCallback(async () => {
    const prev = liked;
    setLiked(!liked);
    setLikeCount((c: number) => (!liked ? c + 1 : c - 1));
    try {
      const res: any = await postsAPI.likePost(post._id);
      onLikeUpdate?.(post._id, res.isLiked, res.likeCount);
    } catch {
      setLiked(prev);
      setLikeCount((c: number) => (prev ? c - 1 : c + 1));
    }
  }, [liked, post._id]);

  const rc = getRoleConfig(post.user?.role);
  const isNews = post.type === "news";
  const isUpdate = post.type === "update";
  const parts = parseContent(post.content);

  return (
    <Pressable
      style={[
        styles.card,
        (isNews || isUpdate) && {
          borderLeftWidth: 3,
          borderLeftColor: isNews ? COLORS.roleReporter : COLORS.roleMla,
        },
      ]}
      onPress={() =>
        onPress ? onPress(post) : router.push(`/post/${post._id}`)
      }
    >
      {/* Special banner */}
      {(isNews || isUpdate) && (
        <LinearGradient
          colors={
            isNews ? ["#3B82F620", "#3B82F605"] : ["#FF6B2B20", "#FF6B2B05"]
          }
          style={styles.banner}
        >
          <Ionicons
            name={isNews ? "newspaper" : "megaphone"}
            size={12}
            color={isNews ? COLORS.roleReporter : COLORS.roleMla}
          />
          <Text
            style={[
              styles.bannerText,
              { color: isNews ? COLORS.roleReporter : COLORS.roleMla },
            ]}
          >
            {isNews ? "NEWS" : "OFFICIAL UPDATE"}
          </Text>
        </LinearGradient>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${post.user?._id}`)}
        >
          <Avatar user={post.user} size={40} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.name}>{post.user?.name}</Text>
              {post.user?.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={rc.color}
                  style={{ marginLeft: 3 }}
                />
              )}
            </View>
            <View style={styles.meta}>
              <RoleBadge role={post.user?.role} />
              <Text style={styles.metaText}>
                📍 {post.user?.location?.ward}
              </Text>
              <Text style={styles.metaText}>{timeAgo(post.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!!post.content && (
        <Text style={styles.content} numberOfLines={4}>
          {parts.map((p, i) => (
            <Text
              key={i}
              style={
                p.type === "hashtag"
                  ? styles.hashtag
                  : p.type === "mention"
                    ? styles.mention
                    : {}
              }
            >
              {p.value}
            </Text>
          ))}
        </Text>
      )}

      {/* Image */}
      {post.mediaUrl && post.mediaType === "image" && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* Video */}
      {post.mediaUrl && post.mediaType === "video" && (
        <View>
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <Ionicons
              name="play-circle"
              size={48}
              color="rgba(255,255,255,0.9)"
            />
          </View>
        </View>
      )}

      {/* Hashtag chips */}
      {post.hashtags?.length > 0 && (
        <View style={styles.tagRow}>
          {post.hashtags.slice(0, 3).map((t: string, i: number) => (
            <Text key={i} style={styles.tag}>
              {t}
            </Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={22}
            color={liked ? COLORS.error : COLORS.textSecondary}
          />
          <Text style={[styles.count, liked && { color: COLORS.error }]}>
            {formatCount(likeCount)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/post/${post._id}`)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={21}
            color={COLORS.textSecondary}
          />
          <Text style={styles.count}>
            {formatCount(post.commentCount || post.comments?.length || 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons
            name="arrow-redo-outline"
            size={21}
            color={COLORS.textSecondary}
          />
          <Text style={styles.count}>{formatCount(post.shares || 0)}</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SIZES.md,
    paddingVertical: 7,
  },
  bannerText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
  },
  userRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  name: {
    fontSize: SIZES.bodyLg,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  metaText: { fontSize: 11, color: COLORS.textMuted },
  content: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    lineHeight: 21,
    paddingHorizontal: SIZES.md,
    paddingBottom: 10,
  },
  hashtag: { color: COLORS.primary, fontWeight: "600" },
  mention: { color: COLORS.secondary, fontWeight: "600" },
  media: { width: "100%", height: SW * 0.65 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: SIZES.md,
    paddingVertical: 6,
  },
  tag: {
    fontSize: 12,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: 10,
    gap: 20,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  count: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
