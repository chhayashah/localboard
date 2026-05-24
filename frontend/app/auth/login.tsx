import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { isValidPhone, isValidEmail } from "../../constants/helpers";
import { toast } from "../../components/common/Toast";

const { width: W, height: H } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveAuth } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const startTimer = () => {
    setTimer(60);
    const iv = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(iv);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (val: string, idx: number) => {
    const digits = [...otpDigits];
    digits[idx] = val.replace(/\D/g, "").slice(-1);
    setOtpDigits(digits);
    setOtp(digits.join(""));
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
  };

  const handleSendOTP = async () => {
    if (!isValidPhone(phone) && !isValidEmail(phone)) {
      toast.warning("Enter a valid Indian phone number or email.");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.sendOTP(phone);
      if (res.success) {
        setStep("otp");
        startTimer();
        toast.info("OTP sent successfully!");
        if (res.otp) toast.info(`Dev Mode OTP: ${res.otp}`, 8000);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const finalOtp = otpDigits.join("");
    if (finalOtp.length < 6) {
      toast.warning("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.verifyOTP(phone, finalOtp);
      if (res.success) {
        if (res.isNewUser) {
          toast.success("OTP verified! Complete your profile.");
          router.push({ pathname: "/auth/signup", params: { phone } });
        } else {
          await saveAuth(res.token, res.user);
          toast.success("Welcome back to LocalBoard! 🎉");
          router.replace("/(tabs)");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      {/* Background */}
      <LinearGradient
        colors={["#09090F", "#0f0a1a", "#09090F"]}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        {/* ── Logo ── */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 36 }}>🏙️</Text>
          </View>
          <Text style={styles.logoText}>
            <Text style={{ color: "#fff" }}>Grow</Text>
            <Text style={{ color: COLORS.primary }}>Up</Text>
          </Text>
          <Text style={styles.logoTagline}>Apna Sheher. Apni Awaaz.</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {step === "phone" ? (
            <>
              <Text style={styles.cardTitle}>Welcome Back 👋</Text>
              <Text style={styles.cardSub}>
                Sign in or create your LocalBoard account
              </Text>

              {/* Phone input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number or Email</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.flagWrap}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.flagCode}>+91</Text>
                  </View>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.input}
                    placeholder="9876543210 or email@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleSendOTP}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.ctaBtn, loading && { opacity: 0.6 }]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaBtnGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>Send OTP</Text>
                      <Ionicons name="arrow-forward" size={18} color="#000" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>New to LocalBoard?</Text>
                <View style={styles.orLine} />
              </View>

              {/* Sign up CTA */}
              <TouchableOpacity
                style={styles.signupBtn}
                onPress={() => router.push("/auth/signup")}
              >
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.signupBtnText}>
                  Create Account — It's Free
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Back */}
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => {
                  setStep("phone");
                  setOtpDigits(["", "", "", "", "", ""]);
                  setOtp("");
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.backText}>Change number</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Enter OTP 🔐</Text>
              <Text style={styles.cardSub}>
                Sent to{" "}
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                  {phone}
                </Text>
              </Text>

              {/* OTP boxes */}
              <View style={styles.otpRow}>
                {otpDigits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={otpRefs[i]}
                    style={[styles.otpBox, d && styles.otpBoxFilled]}
                    value={d}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.ctaBtn, loading && { opacity: 0.6 }]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaBtnGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <Text style={styles.ctaBtnText}>Verify & Continue</Text>
                      <Ionicons name="checkmark" size={18} color="#000" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendRow}
                onPress={timer === 0 ? handleSendOTP : undefined}
                disabled={timer > 0}
              >
                <Ionicons
                  name="refresh-outline"
                  size={14}
                  color={timer > 0 ? COLORS.textMuted : COLORS.primary}
                />
                <Text
                  style={[
                    styles.resendText,
                    timer > 0 && { color: COLORS.textMuted },
                  ]}
                >
                  {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Features row */}
        <View style={styles.features}>
          {[
            { icon: "location-outline", text: "Ward-level feed" },
            { icon: "briefcase-outline", text: "Free job posts" },
            { icon: "megaphone-outline", text: "Local democracy" },
          ].map((f) => (
            <View key={f.text} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name={f.icon as any}
                  size={15}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  glowTop: {
    position: "absolute",
    top: -80,
    left: W / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },
  glowBottom: {
    position: "absolute",
    bottom: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.secondary,
    opacity: 0.05,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
    gap: 20,
  },
  logoSection: { alignItems: "center", gap: 8 },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(245,166,35,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(245,166,35,0.25)",
    marginBottom: 4,
  },
  logoText: { fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  logoTagline: { fontSize: 13, color: COLORS.textMuted, fontStyle: "italic" },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  cardSub: { fontSize: 13, color: COLORS.textMuted, marginTop: -8 },
  inputGroup: { gap: 8 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  flagWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  flag: { fontSize: 18 },
  flagCode: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  divider: { width: 1, height: 24, backgroundColor: COLORS.border },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  ctaBtn: { borderRadius: 14, overflow: "hidden" },
  ctaBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaBtnText: { fontSize: 16, fontWeight: "800", color: "#000" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  signupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.primary + "08",
  },
  signupBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  otpRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.bgInput,
    borderWidth: 2,
    borderColor: COLORS.border,
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resendText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  features: { flexDirection: "row", justifyContent: "space-around" },
  featureItem: { alignItems: "center", gap: 6 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: COLORS.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  featureText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: { fontSize: 11, color: COLORS.textMuted, textAlign: "center" },
});
