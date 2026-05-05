import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../services/api";

export default function SignupScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({
    name: "",
    city: "",
    ward: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    if (!form.name || !form.city || !form.ward || !form.pincode)
      return Alert.alert("Required", "Sab fields bharo");
    if (form.pincode.length !== 6)
      return Alert.alert("Invalid", "Sahi 6-digit pincode daalo");
    setLoading(true);
    try {
      const res: any = await authAPI.signup({ phone, ...form });
      if (res.success) {
        await saveAuth(res.token, res.user);
        router.replace("/(tabs)");
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>🏙️ Profile Banao</Text>
        <Text style={styles.subtitle}>Ek baar — phir LocalBoard ready!</Text>

        {[
          {
            k: "name",
            label: "Poora Naam *",
            ph: "Ramesh Kumar",
            kb: "default" as const,
          },
          {
            k: "ward",
            label: "Ward / Mohalla *",
            ph: "Ward 12, Napier Town",
            kb: "default" as const,
          },
          {
            k: "city",
            label: "Sheher *",
            ph: "Jabalpur",
            kb: "default" as const,
          },
          {
            k: "pincode",
            label: "Pincode *",
            ph: "482001",
            kb: "number-pad" as const,
            max: 6,
          },
        ].map((f) => (
          <View key={f.k} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.ph}
              placeholderTextColor={COLORS.textMuted}
              value={form[f.k as keyof typeof form]}
              onChangeText={(v) => set(f.k, v)}
              keyboardType={f.kb}
              maxLength={f.max}
              autoCapitalize={f.k === "pincode" ? "none" : "words"}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>LocalBoard Join Karo 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 32,
    fontStyle: "italic",
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
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: "800", color: "#000" },
});
