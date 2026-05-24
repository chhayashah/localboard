import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
    key: "phone",
    title: "Your phone number?",
    sub: "We'll send an OTP to verify.",
    placeholder: "9876543210",
    emoji: "📱",
    keyboard: "phone-pad" as const,
    max: 10,
  },
  {
    key: "name",
    title: "What's your name?",
    sub: "This is how you'll appear on LocalBoard.",
    placeholder: "e.g. Ramesh Kumar",
    emoji: "👤",
    keyboard: "default" as const,
    max: 50,
  },
  {
    key: "ward",
    title: "Your ward or area?",
    sub: "We'll show you content from your neighborhood.",
    placeholder: "e.g. Ward 12, Napier Town",
    emoji: "📍",
    keyboard: "default" as const,
    max: 80,
  },
  {
    key: "city",
    title: "Which city?",
    sub: "Helps us find local content near you.",
    placeholder: "e.g. Jabalpur",
    emoji: "🏙️",
    keyboard: "default" as const,
    max: 50,
  },
  {
    key: "pincode",
    title: "Your pincode?",
    sub: "6-digit pincode for precise local matching.",
    placeholder: "e.g. 482001",
    emoji: "📮",
    keyboard: "number-pad" as const,
    max: 6,
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone: string }>();
  const { saveAuth } = useAuth();

  // If phone came from OTP login, skip phone step
  const phoneFromLogin = params.phone || "";
  const startStep = phoneFromLogin ? 1 : 0;

  const [step, setStep] = useState(startStep);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    phone: phoneFromLogin,
    name: "",
    ward: "",
    city: "",
    pincode: "",
  });

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [step]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Steps to show — skip phone step if came from OTP
  const visibleSteps = phoneFromLogin ? STEPS.slice(1) : STEPS;
  const currentStep = visibleSteps[step];
  const currentVal = form[currentStep.key as keyof typeof form];
  const totalSteps = visibleSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = async () => {
    // Validate
    if (!currentVal.trim()) {
      toast.warning(`Please enter your ${currentStep.key}.`);
      inputRef.current?.focus();
      return;
    }
    if (currentStep.key === "pincode" && currentVal.length !== 6) {
      toast.warning("Enter a valid 6-digit pincode.");
      inputRef.current?.focus();
      return;
    }
    if (currentStep.key === "phone" && !/^[6-9]\d{9}$/.test(currentVal)) {
      toast.warning("Enter a valid 10-digit Indian phone number.");
      inputRef.current?.focus();
      return;
    }

    // Not last step
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Last step — submit
    setLoading(true);
    try {
      const payload = {
        phone: form.phone.trim(),
        name: form.name.trim(),
        ward: form.ward.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
      };

      console.log("Submitting signup:", payload);

      if (!payload.phone) {
        toast.error("Phone number is missing. Please go back and try again.");
        setLoading(false);
        return;
      }

      const res: any = await authAPI.signup(payload);
      if (res.success) {
        await saveAuth(res.token, res.user);
        toast.success("🎉 Welcome to GrowUp!");
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
      <View style={[styles.container, { paddingTop: insets.top + 14 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress}%` as any }]}
              />
            </View>
            <Text style={styles.progressText}>
              Step {step + 1} of {totalSteps}
            </Text>
          </View>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {visibleSteps.map((_, i) => (
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

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.emojiBox}>
            <Text style={{ fontSize: 38 }}>{currentStep.emoji}</Text>
          </View>

          <Text style={styles.stepTitle}>{currentStep.title}</Text>
          <Text style={styles.stepSub}>{currentStep.sub}</Text>

          {/* Input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={currentStep.placeholder}
            placeholderTextColor={COLORS.textMuted}
            value={currentVal}
            onChangeText={(v) => set(currentStep.key, v)}
            keyboardType={currentStep.keyboard}
            maxLength={currentStep.max}
            autoCapitalize={
              currentStep.key === "pincode" || currentStep.key === "phone"
                ? "none"
                : "words"
            }
            returnKeyType={step < totalSteps - 1 ? "next" : "done"}
            onSubmitEditing={handleNext}
            editable={!loading}
          />

          {/* Completed fields summary */}
          {step > 0 && (
            <View style={styles.summaryBox}>
              {visibleSteps.slice(0, step).map((s) => (
                <View key={s.key} style={styles.summaryRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={COLORS.success}
                  />
                  <Text style={styles.summaryKey}>{s.key}:</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>
                    {form[s.key as keyof typeof form]}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setStep(visibleSteps.findIndex((x) => x.key === s.key))
                    }
                  >
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* CTA */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={[styles.nextBtn, loading && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {step < totalSteps - 1 ? "Continue" : "Join GrowUp 🚀"}
                  </Text>
                  <Ionicons
                    name={
                      step < totalSteps - 1
                        ? "arrow-forward"
                        : "checkmark-circle"
                    }
                    size={20}
                    color="#000"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            By joining, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    marginBottom: 20,
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
    flexShrink: 0,
  },
  progressWrap: { flex: 1, gap: 6 },
  progressTrack: {
    height: 5,
    backgroundColor: COLORS.bgInput,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgInput,
  },
  dotActive: { width: 28, backgroundColor: COLORS.primary, borderRadius: 4 },
  dotDone: { backgroundColor: COLORS.success },
  content: { flex: 1, paddingHorizontal: 22 },
  emojiBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary + "25",
    marginBottom: 22,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + "40",
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryKey: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  summaryVal: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  editLink: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  bottom: { paddingHorizontal: 22, gap: 12 },
  nextBtn: { borderRadius: 16, overflow: "hidden" },
  nextBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  nextBtnText: { fontSize: 17, fontWeight: "800", color: "#000" },
  footerNote: { fontSize: 11, color: COLORS.textMuted, textAlign: "center" },
});
