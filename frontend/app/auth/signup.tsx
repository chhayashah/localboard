import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const ROLES = [
  { value: "user", label: "👤 Citizen", desc: "Apne ward ki baat karein" },
  { value: "reporter", label: "📰 Reporter", desc: "News report karein" },
  {
    value: "mla",
    label: "🏛️ MLA/Parshad",
    desc: "Official updates share karein",
  },
  {
    value: "opposition",
    label: "⚖️ Opposition",
    desc: "Public discourse engage karein",
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({
    name: "",
    city: "",
    ward: "",
    pincode: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    if (!form.name || !form.city || !form.ward || !form.pincode) {
      Alert.alert("Incomplete", "Sab fields zaroori hain");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      Alert.alert("Invalid", "6-digit pincode dalein");
      return;
    }
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
    <LinearGradient colors={["#0A0A0F", "#12121A"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Apna Profile Banayein</Text>
        <Text style={{ color: COLORS.textSecondary, marginBottom: SIZES.xl }}>
          +91 {phone}
        </Text>

        {[
          {
            k: "name",
            label: "Aapka Naam *",
            placeholder: "Poora naam likhein",
          },
          { k: "city", label: "Sheher *", placeholder: "Jaise: Bhopal, Delhi" },
          {
            k: "ward",
            label: "Ward / Mohalla *",
            placeholder: "Jaise: Ward 12, Kolar Road",
          },
          {
            k: "pincode",
            label: "Pincode *",
            placeholder: "6-digit pincode",
            kb: "number-pad",
            max: 6,
          },
        ].map((f) => (
          <View key={f.k} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={COLORS.textMuted}
              value={form[f.k as keyof typeof form]}
              onChangeText={(v) => set(f.k, v)}
              keyboardType={(f as any).kb || "default"}
              maxLength={(f as any).max}
            />
          </View>
        ))}

        <View style={styles.field}>
          <Text style={styles.label}>Aap kaun hain? *</Text>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.roleOption,
                form.role === r.value && styles.roleActive,
              ]}
              onPress={() => set("role", r.value)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.roleLabel}>{r.label}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {r.desc}
                </Text>
              </View>
              {form.role === r.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>LocalBoard Join Karein 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SIZES.screenPadding,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: SIZES.display,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  field: { marginBottom: SIZES.lg },
  label: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: SIZES.bodyLg,
    color: COLORS.textPrimary,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  roleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  roleLabel: {
    fontSize: SIZES.bodyLg,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: SIZES.bodyLg, fontWeight: "700" },
});
