import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, KeyboardAvoidingView,
  Platform, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../constants/theme";
import { postsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "../components/common/Toast";
import Avatar from "../components/common/Avatar";

const { width: SCREEN_W } = Dimensions.get("window");

const POST_TYPES = [
  { k: "post",   label: "📝", title: "Post"   },
  { k: "reel",   label: "🎬", title: "Reel"   },
  { k: "news",   label: "📰", title: "News"   },
  { k: "update", label: "🏛️", title: "Update" },
];

export default function CreateScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { user } = useAuth();

  const [content,   setContent]   = useState("");
  const [type,      setType]      = useState("post");
  const [media,     setMedia]     = useState<any>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);

  // ─── Pick Photo ───────────────────────────────────────────
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.warning("Gallery access is required.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled) {
      setMedia(res.assets[0]);
      setThumbnail(null);
      setType("post");
    }
  };

  // ─── Pick Video / Reel ────────────────────────────────────
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.warning("Gallery access is required.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      setMedia(asset);
      setType("reel");

      // Generate thumbnail
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 1000,
        });
        setThumbnail(uri);
      } catch {}
    }
  };

  // ─── Camera ───────────────────────────────────────────────
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      toast.warning("Camera access is required.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      setMedia(asset);
      if (asset.type === "video") {
        setType("reel");
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
          setThumbnail(uri);
        } catch {}
      } else {
        setType("post");
        setThumbnail(null);
      }
    }
  };

  // ─── Remove Media ─────────────────────────────────────────
  const removeMedia = () => {
    setMedia(null);
    setThumbnail(null);
    setType("post");
  };

  // ─── Post ─────────────────────────────────────────────────
  const handlePost = async () => {
    if (!content.trim() && !media) {
      toast.warning("Write something or add a photo/video.");
      return;
    }
    setLoading(true);
    setUploading(!!media);

    // Fake progress for UX
    let prog = 0;
    const interval = media ? setInterval(() => {
      prog += 10;
      setProgress(Math.min(prog, 90));
      if (prog >= 90) clearInterval(interval);
    }, 300) : null;

    try {
      const fd = new FormData();
      fd.append("content", content.trim());
      fd.append("type", type);

      if (media) {
        const ext = media.uri.split(".").pop();
        const isVideo = media.type === "video";
        fd.append("media", {
          uri: media.uri,
          type: isVideo ? `video/${ext}` : `image/${ext}`,
          name: `media.${ext}`,
        } as any);
      }

      const res: any = await postsAPI.createPost(fd);

      if (interval) clearInterval(interval);
      setProgress(100);

      if (res.success) {
        setTimeout(() => {
          toast.success(
            type === "reel"
              ? "🎬 Reel uploaded successfully!"
              : "✅ Posted successfully!"
          );
          router.replace("/(tabs)");
        }, 500);
      }
    } catch (e: any) {
      if (interval) clearInterval(interval);
      toast.error(e.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setUploading(false);
      setProgress(0);
    }
  };

  const canPost = ["news", "update"].includes(type)
    ? ["reporter", "mla", "parshad", "opposition"].includes(user?.role)
    : true;

  const isVideo = media?.type === "video";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.typeTabs}>
          {POST_TYPES.map((t) => {
            const needsRole = ["news", "update"].includes(t.k);
            const allowed = needsRole
              ? ["reporter", "mla", "parshad", "opposition"].includes(user?.role)
              : true;
            return (
              <TouchableOpacity
                key={t.k}
                style={[styles.typeTab, type === t.k && styles.typeTabOn, !allowed && { opacity: 0.3 }]}
                onPress={() => allowed && setType(t.k)}
                disabled={!allowed}
              >
                <Text style={styles.typeEmoji}>{t.label}</Text>
                <Text style={[styles.typeTitle, type === t.k && styles.typeTitleOn]}>
                  {t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.postBtn, (!canPost || loading) && { opacity: 0.4 }]}
          onPress={handlePost}
          disabled={!canPost || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.postBtnText}>
                {type === "reel" ? "Upload" : "Post"}
              </Text>}
        </TouchableOpacity>
      </View>

      {/* ── Upload Progress ── */}
      {uploading && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress < 100 ? `Uploading... ${progress}%` : "Processing..."}
          </Text>
        </View>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Media Preview ── */}
        {media ? (
          <View style={styles.mediaPreview}>
            <Image
              source={{ uri: thumbnail || media.uri }}
              style={styles.previewImg}
              resizeMode="cover"
            />

            {/* Video overlay */}
            {isVideo && (
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.videoOverlay}
              >
                <View style={styles.playIcon}>
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
                <View style={styles.reelBadge}>
                  <Ionicons name="play-circle" size={14} color={COLORS.primary} />
                  <Text style={styles.reelBadgeText}>REEL</Text>
                </View>
                {media.duration && (
                  <Text style={styles.duration}>
                    {Math.floor(media.duration / 1000)}s
                  </Text>
                )}
              </LinearGradient>
            )}

            {/* Remove button */}
            <TouchableOpacity style={styles.removeBtn} onPress={removeMedia}>
              <View style={styles.removeBtnInner}>
                <Ionicons name="close" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Change media */}
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={isVideo ? pickVideo : pickPhoto}
            >
              <Ionicons name="swap-horizontal" size={14} color="#fff" />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Media Picker ── */
          <View style={styles.pickerArea}>
            {/* Reel picker — big */}
            {type === "reel" ? (
              <TouchableOpacity style={styles.reelPicker} onPress={pickVideo}>
                <LinearGradient
                  colors={["#1a0840", "#0a0020"]}
                  style={styles.reelPickerGrad}
                >
                  <View style={styles.reelPickerIcon}>
                    <Ionicons name="videocam" size={48} color={COLORS.primary} />
                  </View>
                  <Text style={styles.reelPickerTitle}>Select Video</Text>
                  <Text style={styles.reelPickerSub}>Max 60 seconds · MP4, MOV</Text>

                  <View style={styles.reelTips}>
                    {["📱 Vertical video works best", "🎵 Add trending audio", "⚡ Short & engaging wins"].map((tip) => (
                      <View key={tip} style={styles.tipRow}>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              /* Photo / Post picker */
              <View style={styles.mediaBtns}>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickPhoto}>
                  <View style={[styles.mediaBtnIcon, { backgroundColor: COLORS.info + "20" }]}>
                    <Ionicons name="image" size={28} color={COLORS.info} />
                  </View>
                  <Text style={styles.mediaBtnLabel}>Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mediaBtn} onPress={pickVideo}>
                  <View style={[styles.mediaBtnIcon, { backgroundColor: COLORS.primary + "20" }]}>
                    <Ionicons name="videocam" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.mediaBtnLabel}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mediaBtn} onPress={openCamera}>
                  <View style={[styles.mediaBtnIcon, { backgroundColor: COLORS.success + "20" }]}>
                    <Ionicons name="camera" size={28} color={COLORS.success} />
                  </View>
                  <Text style={styles.mediaBtnLabel}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Caption / Content ── */}
        <View style={styles.captionRow}>
          <Avatar user={user} size={38} showBadge />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name}</Text>
            <TextInput
              style={styles.textarea}
              placeholder={
                type === "reel"
                  ? "Write a caption for your reel... #hashtags"
                  : "What's happening in your ward?"
              }
              placeholderTextColor={COLORS.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
            />
          </View>
        </View>

        {/* ── Location ── */}
        <View style={styles.locRow}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={styles.locText}>
            {user?.location?.ward}, {user?.location?.city}
          </Text>
        </View>

        {/* ── Hashtag suggestions for reels ── */}
        {type === "reel" && (
          <View style={styles.hashtagSugg}>
            <Text style={styles.hashtagTitle}>Suggested Tags</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[
                `#${user?.location?.city?.replace(/ /g, "")}Vibes`,
                `#${user?.location?.ward?.replace(/ /g, "")}`,
                "#LocalReel", "#MyWard", "#LocalBoard",
              ].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.hashtagChip}
                  onPress={() => setContent((c) => c + " " + tag)}
                >
                  <Text style={styles.hashtagChipText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Toolbar ── */}
        <View style={styles.toolbar}>
          {[
            { icon: "image-outline",    label: "Photo",  onPress: pickPhoto  },
            { icon: "videocam-outline", label: "Video",  onPress: pickVideo  },
            { icon: "camera-outline",   label: "Camera", onPress: openCamera },
            { icon: "at-outline",       label: "Mention",onPress: () => setContent((c) => c + "@") },
            { icon: "pricetag-outline", label: "Tag",    onPress: () => setContent((c) => c + "#") },
          ].map((t) => (
            <TouchableOpacity key={t.label} style={styles.toolBtn} onPress={t.onPress}>
              <Ionicons name={t.icon as any} size={20} color={COLORS.textMuted} />
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
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  typeTabs:        { flexDirection: "row", gap: 4 },
  typeTab:         { alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: "transparent" },
  typeTabOn:       { backgroundColor: COLORS.primary + "18", borderColor: COLORS.primary + "40" },
  typeEmoji:       { fontSize: 16 },
  typeTitle:       { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, marginTop: 1 },
  typeTitleOn:     { color: COLORS.primary },
  postBtn:         { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postBtnText:     { fontSize: 13, fontWeight: "800", color: "#000" },
  progressWrap:    { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.bgCard },
  progressBar:     { height: 4, backgroundColor: COLORS.bgInput, borderRadius: 2, overflow: "hidden", marginBottom: 4 },
  progressFill:    { height: "100%", backgroundColor: COLORS.primary, borderRadius: 2 },
  progressText:    { fontSize: 11, color: COLORS.textMuted, textAlign: "center" },
  pickerArea:      { padding: 14 },
  reelPicker:      { borderRadius: 16, overflow: "hidden", height: 320 },
  reelPickerGrad:  { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  reelPickerIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + "20", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.primary + "40", marginBottom: 8 },
  reelPickerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary },
  reelPickerSub:   { fontSize: 13, color: COLORS.textMuted },
  reelTips:        { marginTop: 16, width: "100%", gap: 8 },
  tipRow:          { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10 },
  tipText:         { fontSize: 13, color: COLORS.textSecondary },
  mediaBtns:       { flexDirection: "row", gap: 12 },
  mediaBtn:        { flex: 1, alignItems: "center", gap: 8, backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  mediaBtnIcon:    { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  mediaBtnLabel:   { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  mediaPreview:    { width: "100%", height: 360, position: "relative" },
  previewImg:      { width: "100%", height: "100%" },
  videoOverlay:    { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", justifyContent: "flex-end", padding: 14 },
  playIcon:        { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -28 }, { translateY: -28 }], width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  reelBadge:       { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
  reelBadgeText:   { fontSize: 11, fontWeight: "800", color: COLORS.primary, letterSpacing: 1 },
  duration:        { position: "absolute", bottom: 14, right: 14, fontSize: 13, fontWeight: "700", color: "#fff", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  removeBtn:       { position: "absolute", top: 12, right: 12 },
  removeBtnInner:  { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" },
  changeBtn:       { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  changeBtnText:   { fontSize: 12, color: "#fff", fontWeight: "600" },
  captionRow:      { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  userName:        { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  textarea:        { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22, minHeight: 80 },
  locRow:          { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 14, marginBottom: 12, backgroundColor: COLORS.primary + "10", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.primary + "25", alignSelf: "flex-start" },
  locText:         { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  hashtagSugg:     { paddingHorizontal: 14, marginBottom: 12 },
  hashtagTitle:    { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  hashtagChip:     { backgroundColor: COLORS.primary + "15", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.primary + "30" },
  hashtagChipText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  toolbar:         { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 4 },
  toolBtn:         { flex: 1, alignItems: "center", gap: 3, padding: 6 },
  toolLabel:       { fontSize: 9, color: COLORS.textMuted, fontWeight: "700" },
  charCount:       { textAlign: "right", paddingHorizontal: 16, paddingBottom: 20, fontSize: 11, color: COLORS.textMuted },
});