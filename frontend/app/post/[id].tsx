import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/common/Avatar";
import RoleBadge from "../../components/common/RoleBadge";
import { formatCount, timeAgo } from "../../constants/helpers";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { postsAPI } from "../../services/api";

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res: any = await postsAPI.getPost(id);
      if (res.success) {
        setPost(res.post);
        setLiked(res.post.isLiked);
        setLikeCount(res.post.likeCount);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const prev = liked;
    const prevC = likeCount;
    setLiked(!liked);
    setLikeCount((c) => (!liked ? c + 1 : c - 1));
    try {
      await postsAPI.likePost(id);
    } catch {
      setLiked(prev);
      setLikeCount(prevC);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res: any = await postsAPI.addComment(id, comment.trim());
      if (res.success) {
        setPost((p: any) => ({
          ...p,
          comments: [...(p.comments || []), res.comment],
          commentCount: res.commentCount,
        }));
        setComment("");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Karein?", "Yeh undo nahi ho sakta", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await postsAPI.deletePost(id);
            router.back();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  if (loading || !post)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  const isOwner = post.user?._id === user?._id;

  const Header = () => (
    <View>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${post.user?._id}`)}
        >
          <Avatar user={post.user} size={44} showBadge />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{post.user?.name}</Text>
              <RoleBadge role={post.user?.role} />
            </View>
            <Text style={styles.meta}>
              📍 {post.user?.location?.ward} · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      {post.mediaUrl && (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      )}
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}

      {/* Stats + Actions */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {formatCount(likeCount)} likes ·{" "}
          {formatCount(post.comments?.length || 0)} comments ·{" "}
          {formatCount(post.views || 0)} views
        </Text>
      </View>
      <View style={styles.actionBar}>
        {[
          {
            icon: liked ? "heart" : "heart-outline",
            color: liked ? COLORS.error : COLORS.textSecondary,
            label: "Like",
            onPress: handleLike,
          },
          {
            icon: "chatbubble-outline",
            color: COLORS.textSecondary,
            label: "Comment",
            onPress: () => inputRef.current?.focus(),
          },
          {
            icon: "arrow-redo-outline",
            color: COLORS.textSecondary,
            label: "Share",
            onPress: () => {},
          },
        ].map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionBtn}
            onPress={a.onPress}
          >
            <Ionicons name={a.icon as any} size={22} color={a.color} />
            <Text style={[styles.actionLabel, { color: a.color }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.commentsHdr}>
        <Text style={styles.commentsTitle}>
          Comments ({post.comments?.length || 0})
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      keyboardVerticalOffset={insets.top + 44}
    >
      <View style={[styles.nav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Post</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList
        data={post.comments || []}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Avatar user={item.user} size={34} />
            <View style={styles.commentBubble}>
              <View style={styles.commentHdr}>
                <Text style={styles.commentName}>{item.user?.name}</Text>
                <RoleBadge role={item.user?.role} />
                <Text style={styles.commentTime}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 30, alignItems: "center" }}>
            <Text style={{ color: COLORS.textMuted }}>
              Pehle comment karein! 💬
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Comment Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <Avatar user={user} size={34} />
        <TextInput
          ref={inputRef}
          style={styles.inputField}
          placeholder="Comment karein..."
          placeholderTextColor={COLORS.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!comment.trim() || posting) && { opacity: 0.4 },
          ]}
          onPress={handleComment}
          disabled={!comment.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="send" size={16} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  postHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  meta: { fontSize: 11, color: COLORS.textMuted },
  media: { width: "100%", height: 280 },
  content: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
    padding: 16,
  },
  stats: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statsText: { fontSize: 12, color: COLORS.textMuted },
  actionBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  actionLabel: { fontSize: 13, fontWeight: "600" },
  commentsHdr: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentsTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  comment: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 10,
  },
  commentHdr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  commentName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  commentTime: { fontSize: 10, color: COLORS.textMuted, marginLeft: "auto" },
  commentText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
