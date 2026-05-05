import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../components/common/Avatar";
import { COLORS, SIZES } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { postsAPI } from "../services/api";

const POST_TYPES = [
  { k: "post", label: "📝 Post" },
  { k: "reel", label: "🎬 Reel" },
  { k: "news", label: "📰 News" },
  { k: "update", label: "🏛️ Update" },
];

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [type, setType] = useState("post");
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled) {
      setMedia(res.assets[0]);
      if (res.assets[0].type === "video") setType("reel");
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !media)
      return Alert.alert("Required", "Kuch likhein ya media add karein");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      fd.append("type", type);
      if (media) {
        const ext = media.uri.split(".").pop();
        fd.append("media", {
          uri: media.uri,
          type: media.type === "video" ? `video/${ext}` : `image/${ext}`,
          name: `media.${ext}`,
        } as any);
      }
      const res: any = await postsAPI.createPost(fd);
      if (res.success) {
        Alert.alert("✅ Post ho gaya!", "", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const canPost = ["news", "update"].includes(type)
    ? ["reporter", "mla", "parshad", "opposition"].includes(user?.role)
    : true;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Naya Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, (!canPost || loading) && { opacity: 0.4 }]}
          onPress={handlePost}
          disabled={!canPost || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.postBtnText}>Post Karo →</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typesRow}
        >
          {POST_TYPES.map((t) => {
            const needsRole = ["news", "update"].includes(t.k);
            const allowed = needsRole
              ? ["reporter", "mla", "parshad", "opposition"].includes(
                  user?.role,
                )
              : true;
            return (
              <TouchableOpacity
                key={t.k}
                style={[
                  styles.typeChip,
                  type === t.k && styles.typeChipOn,
                  !allowed && { opacity: 0.35 },
                ]}
                onPress={() => allowed && setType(t.k)}
                disabled={!allowed}
              >
                <Text
                  style={[styles.typeText, type === t.k && styles.typeTextOn]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!canPost && (
          <View style={styles.roleWarn}>
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color={COLORS.warning}
            />
            <Text style={styles.roleWarnText}>
              Yeh type sirf reporters aur leaders ke liye hai
            </Text>
          </View>
        )}

        {/* User row + textarea */}
        <View style={styles.inputRow}>
          <Avatar user={user} size={40} showBadge />
          <TextInput
            style={styles.textarea}
            placeholder="Kya ho raha hai apne ward mein? Share karo..."
            placeholderTextColor={COLORS.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            autoFocus
          />
        </View>

        {/* Location tag */}
        <View style={styles.locTag}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={styles.locText}>
            {user?.location?.ward}, {user?.location?.city}
          </Text>
        </View>

        {/* Media Preview / Add */}
        {media ? (
          <View style={styles.mediaPreview}>
            <Image
              source={{ uri: media.uri }}
              style={styles.previewImg}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeMedia}
              onPress={() => setMedia(null)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.mediaAdd} onPress={pickMedia}>
            <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.mediaAddText}>Photo ya Video add karo</Text>
          </TouchableOpacity>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          {[
            { icon: "image-outline", label: "Photo", onPress: pickMedia },
            { icon: "videocam-outline", label: "Video", onPress: pickMedia },
            { icon: "location-outline", label: "Location", onPress: () => {} },
            {
              icon: "at-outline",
              label: "Mention",
              onPress: () => setContent((c) => c + "@"),
            },
            {
              icon: "pricetag-outline",
              label: "Tag",
              onPress: () => setContent((c) => c + "#"),
            },
          ].map((t) => (
            <TouchableOpacity
              key={t.label}
              style={styles.toolBtn}
              onPress={t.onPress}
            >
              <Ionicons
                name={t.icon as any}
                size={20}
                color={COLORS.textMuted}
              />
              <Text style={styles.toolLabel}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.charCount}>{content.length}/1000</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary },
  postBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnText: { fontSize: 13, fontWeight: "800", color: "#000" },
  typesRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  typeChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  typeTextOn: { color: "#000" },
  roleWarn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 14,
    padding: 10,
    backgroundColor: COLORS.warning + "12",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.warning + "30",
    marginBottom: 8,
  },
  roleWarnText: { fontSize: 12, color: COLORS.warning, flex: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textarea: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
    minHeight: 100,
  },
  locTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
    alignSelf: "flex-start",
  },
  locText: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  mediaPreview: {
    marginHorizontal: 14,
    borderRadius: 14,
    overflow: "hidden",
    height: 200,
    position: "relative",
    marginBottom: 12,
  },
  previewImg: { width: "100%", height: "100%" },
  removeMedia: { position: "absolute", top: 8, right: 8 },
  mediaAdd: {
    marginHorizontal: 14,
    height: 120,
    backgroundColor: COLORS.bgInput,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  mediaAddText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  toolBtn: { flex: 1, alignItems: "center", gap: 3, padding: 6 },
  toolLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: "700" },
  charCount: {
    textAlign: "right",
    paddingHorizontal: 16,
    paddingBottom: 20,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
