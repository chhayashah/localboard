import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS, SIZES } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../components/common/Toast";

export default function SignupScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({
    name: "", city: "", ward: "", pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    if (!form.name || !form.city || !form.ward || !form.pincode) {
      toast.warning("Please fill all fields.");
      return;
    }
    if (form.pincode.length !== 6) {
      toast.warning("Enter valid 6-digit pincode.");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.signup({ phone, ...form });
      if (res.success) {
        await saveAuth(res.token, res.user);
        toast.success("🎉 Welcome to LocalBoard!");
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong.");
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
        <Text style={styles.title}>🏙️ Create Profile</Text>
        <Text style={styles.subtitle}>One time setup — then LocalBoard is yours!</Text>

        {[
          { k: "name",    label: "Full Name *",     ph: "Ramesh Kumar",      kb: "default"     as const },
          { k: "ward",    label: "Ward / Area *",   ph: "Ward 12, Napier Town", kb: "default"  as const },
          { k: "city",    label: "City *",           ph: "Jabalpur",          kb: "default"     as const },
          { k: "pincode", label: "Pincode *",        ph: "482001",            kb: "number-pad"  as const, max: 6 },
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
              maxLength={(f as any).max}
              autoCapitalize={f.k === "pincode" ? "none" : "words"}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>Join LocalBoard 🚀</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title:     { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 6 },
  subtitle:  { fontSize: 14, color: COLORS.textMuted, marginBottom: 32, fontStyle: "italic" },
  field:     { marginBottom: 18 },
  label:     { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  input:     { backgroundColor: COLORS.bgCard, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  btn:       { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  btnText:   { fontSize: 16, fontWeight: "800", color: "#000" },
});