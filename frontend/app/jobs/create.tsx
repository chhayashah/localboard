import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JOB_CATEGORIES } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";
import { jobsAPI } from "../../services/api";

export default function CreateJobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    contactPhone: "",
    whatsapp: "",
    salaryAmount: "",
    salaryPeriod: "monthly",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.contactPhone)
      return Alert.alert(
        "Required",
        "Title, description aur contact number zaroori hai",
      );
    if (!/^[6-9]\d{9}$/.test(form.contactPhone))
      return Alert.alert("Invalid", "Sahi 10-digit phone number daalo");
    setLoading(true);
    try {
      const res: any = await jobsAPI.createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        contactPhone: form.contactPhone,
        whatsapp: form.whatsapp || form.contactPhone,
        salary: form.salaryAmount
          ? {
              amount: parseInt(form.salaryAmount),
              period: form.salaryPeriod,
              negotiable: true,
            }
          : undefined,
      });
      if (res.success) {
        Alert.alert("✅ Job Post Ho Gayi!", "Aapki job listing live hai", [
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
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Post Karo</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.freeTag}>
          <Ionicons name="gift-outline" size={14} color={COLORS.success} />
          <Text style={styles.freeText}>
            LocalBoard pe job post bilkul FREE hai!
          </Text>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="jaise: Video Editor, Delivery Boy, Cook..."
            placeholderTextColor={COLORS.textMuted}
            value={form.title}
            onChangeText={(v) => set("title", v)}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 7 }}
          >
            {JOB_CATEGORIES.filter((c) => c.value !== "all").map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.catChip,
                  form.category === c.value && styles.catChipOn,
                ]}
                onPress={() => set("category", c.value)}
              >
                <Text
                  style={[
                    styles.catText,
                    form.category === c.value && styles.catTextOn,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Job ke baare mein detail mein batao — requirements, timing, location..."
            placeholderTextColor={COLORS.textMuted}
            value={form.description}
            onChangeText={(v) => set("description", v)}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{form.description.length}/1000</Text>
        </View>

        {/* Salary */}
        <View style={styles.field}>
          <Text style={styles.label}>Salary (optional)</Text>
          <View style={styles.salaryRow}>
            <View style={[styles.inputRow, { flex: 1 }]}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={[
                  styles.input,
                  { borderWidth: 0, flex: 1, paddingVertical: 0 },
                ]}
                placeholder="Amount"
                placeholderTextColor={COLORS.textMuted}
                value={form.salaryAmount}
                onChangeText={(v) => set("salaryAmount", v)}
                keyboardType="number-pad"
              />
            </View>
            {["monthly", "daily", "hourly"].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodChip,
                  form.salaryPeriod === p && styles.periodChipOn,
                ]}
                onPress={() => set("salaryPeriod", p)}
              >
                <Text
                  style={[
                    styles.periodText,
                    form.salaryPeriod === p && { color: "#000" },
                  ]}
                >
                  {p === "monthly" ? "/mo" : p === "daily" ? "/day" : "/hr"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.field}>
          <Text style={styles.label}>Contact Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={COLORS.textMuted}
            value={form.contactPhone}
            onChangeText={(v) => set("contactPhone", v)}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>WhatsApp Number (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Blank chhodo agar same hai"
            placeholderTextColor={COLORS.textMuted}
            value={form.whatsapp}
            onChangeText={(v) => set("whatsapp", v)}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>Job Post Karo 🚀</Text>
          )}
        </TouchableOpacity>
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
  scroll: { padding: 16, paddingBottom: 40 },
  freeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.success + "12",
    borderRadius: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
    marginBottom: 20,
  },
  freeText: { fontSize: 13, color: COLORS.success, fontWeight: "600", flex: 1 },
  field: { marginBottom: 20 },
  label: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginBottom: 8,
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
  textarea: { minHeight: 100, paddingTop: 13 },
  charCount: {
    textAlign: "right",
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  catChipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  catTextOn: { color: "#000" },
  salaryRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  rupee: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "800",
    marginRight: 4,
  },
  periodChip: {
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  periodChipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: "800", color: "#000" },
});
