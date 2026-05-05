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
import Avatar from "../../components/common/Avatar";
import { COLORS, SIZES } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { usersAPI } from "../../services/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    ward: user?.location?.ward || "",
    city: user?.location?.city || "",
    pincode: user?.location?.pincode || "",
  });
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setAvatar(res.assets[0]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert("Required", "Naam daalo");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("bio", form.bio);
      fd.append("ward", form.ward);
      fd.append("city", form.city);
      fd.append("pincode", form.pincode);
      if (avatar) {
        const ext = avatar.uri.split(".").pop();
        fd.append("avatar", {
          uri: avatar.uri,
          type: `image/${ext}`,
          name: `avatar.${ext}`,
        } as any);
      }
      const res: any = await usersAPI.updateProfile(fd);
      if (res.success) {
        updateUser(res.user);
        Alert.alert("✅ Saved!", "Profile update ho gaya", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Edit</Text>
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
          ) : (
            <Avatar user={user} size={90} />
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {[
          {
            k: "name",
            label: "Poora Naam *",
            ph: "Your name",
            kb: "default" as const,
          },
          {
            k: "bio",
            label: "Bio",
            ph: "Apne baare mein...",
            kb: "default" as const,
            multi: true,
            max: 160,
          },
          {
            k: "ward",
            label: "Ward / Mohalla",
            ph: "Ward 12",
            kb: "default" as const,
          },
          {
            k: "city",
            label: "Sheher",
            ph: "Jabalpur",
            kb: "default" as const,
          },
          {
            k: "pincode",
            label: "Pincode",
            ph: "482001",
            kb: "number-pad" as const,
            max: 6,
          },
        ].map((f) => (
          <View key={f.k} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={[
                styles.input,
                (f as any).multi && {
                  minHeight: 80,
                  textAlignVertical: "top",
                  paddingTop: 12,
                },
              ]}
              placeholder={f.ph}
              placeholderTextColor={COLORS.textMuted}
              value={form[f.k as keyof typeof form]}
              onChangeText={(v) => set(f.k, v)}
              multiline={(f as any).multi}
              keyboardType={f.kb}
              maxLength={(f as any).max}
              autoCapitalize={f.k === "pincode" ? "none" : "words"}
            />
            {(f as any).multi && (
              <Text style={styles.charCount}>
                {form[f.k as keyof typeof form].length}/{(f as any).max}
              </Text>
            )}
          </View>
        ))}
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    minWidth: 60,
    alignItems: "center",
  },
  saveBtnText: { color: "#000", fontWeight: "800", fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 40 },
  avatarWrap: { alignSelf: "center", marginBottom: 28, position: "relative" },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  field: { marginBottom: 18 },
  label: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  charCount: {
    textAlign: "right",
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
