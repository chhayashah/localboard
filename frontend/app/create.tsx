// app/create.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../constants/theme";
import { postsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Avatar from "../components/common/Avatar";
import RoleBadge from "../components/common/RoleBadge";

const TYPES = [
  { value: "post", label: "📝 Post", roles: null },
  { value: "news", label: "📰 News", roles: ["reporter", "mla", "parshad"] },
  { value: "update", label: "🏛️ Update", roles: ["mla", "parshad"] },
];

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<any>(null);
  const [type, setType] = useState("post");
  const [loading, setLoading] = useState(false);

  const available = TYPES.filter(
    (t) => !t.roles || t.roles.includes(user?.role || ""),
  );

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!r.canceled) {
      setMedia(r.assets[0]);
      if (r.assets[0].type === "video") setType("reel");
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !media) {
      Alert.alert("Empty", "Kuch likhein ya media add karein");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("content", content);
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
      if (res.success) router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Naya Post</Text>
        <TouchableOpacity
          style={[
            styles.btn,
            ((!content.trim() && !media) || loading) && styles.btnOff,
          ]}
          onPress={handlePost}
          disabled={(!content.trim() && !media) || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: SIZES.md,
          }}
        >
          <Avatar user={user} size={44} />
          <View>
            <Text
              style={{
                fontSize: SIZES.bodyLg,
                fontWeight: "700",
                color: COLORS.textPrimary,
              }}
            >
              {user?.name}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 3,
              }}
            >
              <RoleBadge role={user?.role || "user"} />
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                📍 {user?.location?.ward}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: SIZES.md,
            marginBottom: 8,
          }}
        >
          {available.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeChip,
                type === t.value && styles.typeChipActive,
              ]}
              onPress={() => setType(t.value)}
            >
              <Text
                style={[
                  styles.typeText,
                  type === t.value && { color: "#fff", fontWeight: "700" },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Kya ho raha hai aapke ward mein? #hashtag @mention"
          placeholderTextColor={COLORS.textMuted}
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
          maxLength={1000}
        />

        <Text
          style={{
            textAlign: "right",
            paddingRight: SIZES.md,
            fontSize: 11,
            color: content.length > 1000 ? COLORS.error : COLORS.textMuted,
          }}
        >
          {content.length}/1000
        </Text>

        {media && (
          <View
            style={{
              margin: SIZES.md,
              borderRadius: SIZES.radiusMd,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: media.uri }}
              style={{ width: "100%", height: 200, resizeMode: "cover" }}
            />
            <TouchableOpacity
              style={styles.removeMedia}
              onPress={() => setMedia(null)}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.toolbar, { paddingBottom: insets.bottom + 8 }]}>
        {[
          { icon: "image-outline", label: "Gallery", onPress: pickMedia },
          {
            icon: "pricetag-outline",
            label: "Hashtag",
            onPress: () => setContent((c) => c + " #"),
          },
          {
            icon: "at",
            label: "Mention",
            onPress: () => setContent((c) => c + " @"),
          },
        ].map((b, i) => (
          <TouchableOpacity
            key={i}
            style={{ alignItems: "center", gap: 3 }}
            onPress={b.onPress}
          >
            <Ionicons
              name={b.icon as any}
              size={24}
              color={COLORS.textSecondary}
            />
            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.title,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  btnOff: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "700" },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: { fontSize: 12, color: COLORS.textSecondary },
  input: {
    fontSize: SIZES.bodyLg,
    color: COLORS.textPrimary,
    paddingHorizontal: SIZES.md,
    paddingVertical: 8,
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 24,
  },
  removeMedia: { position: "absolute", top: 8, right: 8 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
});
