import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../components/common/Toast";

const STEPS = [
  {
    key: "name",
    title: "What's your name?",
    sub: "This is how you'll appear on LocalBoard.",
  },
  {
    key: "ward",
    title: "Your ward or area?",
    sub: "We'll show you content from your neighborhood.",
  },
  {
    key: "city",
    title: "Which city?",
    sub: "Helps us find local content near you.",
  },
  {
    key: "pincode",
    title: "Your pincode?",
    sub: "6-digit pincode for precise local matching.",
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { saveAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    ward: "",
    city: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const currentStep = STEPS[step];
  const currentVal = form[currentStep.key as keyof typeof form];
  const progress = (step / STEPS.length) * 100;

  const handleNext = async () => {
    if (!currentVal.trim()) {
      toast.warning(`Please enter your ${currentStep.key}.`);
      return;
    }
    if (currentStep.key === "pincode" && currentVal.length !== 6) {
      toast.warning("Enter a valid 6-digit pincode.");
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — submit
    setLoading(true);
    try {
      const res: any = await authAPI.signup({ phone, ...form });
      if (res.success) {
        await saveAuth(res.token, res.user);
        toast.success("🎉 Welcome to LocalBoard!");
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      toast.error(e.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons
                name="arrow-back"
                size={20}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress + 25}%` }]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {step + 1} of {STEPS.length}
              </Text>
            </View>
          </View>

          {/* ── Content ── */}
          <View style={styles.content}>
            {/* Step indicator dots */}
            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === step && styles.dotActive,
                    i < step && styles.dotDone,
                  ]}
                />
              ))}
            </View>

            {/* Icon */}
            <View style={styles.stepIcon}>
              <Text style={{ fontSize: 36 }}>
                {["👤", "📍", "🏙️", "📮"][step]}
              </Text>
            </View>

            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepSub}>{currentStep.sub}</Text>

            {/* Input */}
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder={
                  [
                    "Ramesh Kumar",
                    "Ward 12 / Napier Town",
                    "Jabalpur",
                    "482001",
                  ][step]
                }
                placeholderTextColor={COLORS.textMuted}
                value={currentVal}
                onChangeText={(v) => set(currentStep.key, v)}
                keyboardType={
                  currentStep.key === "pincode" ? "number-pad" : "default"
                }
                maxLength={currentStep.key === "pincode" ? 6 : 50}
                autoCapitalize={
                  currentStep.key === "pincode" ? "none" : "words"
                }
                autoFocus
                onSubmitEditing={handleNext}
                returnKeyType={step < STEPS.length - 1 ? "next" : "done"}
              />
              {currentVal.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => set(currentStep.key, "")}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Filled values */}
            {step > 0 && (
              <View style={styles.filledList}>
                {STEPS.slice(0, step).map((s) => (
                  <View key={s.key} style={styles.filledItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={COLORS.success}
                    />
                    <Text style={styles.filledKey}>{s.key}:</Text>
                    <Text style={styles.filledVal}>
                      {form[s.key as keyof typeof form]}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── CTA ── */}
          <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.nextBtn, loading && { opacity: 0.6 }]}
              onPress={handleNext}
              disabled={loading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>
                      {step < STEPS.length - 1
                        ? "Continue"
                        : "Join LocalBoard 🚀"}
                    </Text>
                    <Ionicons
                      name={
                        step < STEPS.length - 1 ? "arrow-forward" : "checkmark"
                      }
                      size={18}
                      color="#000"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressWrap: { flex: 1, gap: 5 },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.bgInput,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },
  dots: { flexDirection: "row", gap: 7, marginBottom: 28 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgInput,
  },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  dotDone: { backgroundColor: COLORS.success },
  stepIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary + "25",
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  stepSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 28,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: COLORS.textPrimary,
    paddingVertical: 16,
    fontWeight: "600",
  },
  clearBtn: { padding: 4 },
  filledList: { gap: 7 },
  filledItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  filledKey: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  filledVal: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  bottom: { paddingHorizontal: 22 },
  nextBtn: { borderRadius: 16, overflow: "hidden" },
  nextBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  nextBtnText: { fontSize: 17, fontWeight: "800", color: "#000" },
});
