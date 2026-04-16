import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { isValidPhone } from "../../constants/helpers";

export default function LoginScreen() {
  const router = useRouter();
  const { saveAuth } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const refs = useRef<any[]>([]);

  const startTimer = () => {
    setCountdown(60);
    const t = setInterval(
      () =>
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(t);
            return 0;
          }
          return c - 1;
        }),
      1000,
    );
  };

  const sendOTP = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert("Invalid", "Valid 10-digit number dalein");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.sendOTP(phone);
      if (res.success) {
        setStep("otp");
        startTimer();
        if (res.otp) setOtp(res.otp.split(""));
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (val: string, idx: number) => {
    const n = [...otp];
    n[idx] = val;
    setOtp(n);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (!val && idx > 0) refs.current[idx - 1]?.focus();
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      Alert.alert("Invalid", "6-digit OTP dalein");
      return;
    }
    setLoading(true);
    try {
      const res: any = await authAPI.verifyOTP(phone, code);
      if (res.success) {
        if (res.isNewUser)
          router.push({ pathname: "/auth/signup", params: { phone } });
        else {
          await saveAuth(res.token, res.user);
          router.replace("/(tabs)");
        }
      }
    } catch (e: any) {
      Alert.alert("Wrong OTP", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0A0F", "#12121A", "#0A0A0F"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: SIZES.screenPadding,
          paddingBottom: 32,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: SIZES.xxl }}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 36 }}>🏙️</Text>
          </View>
          <Text style={styles.appName}>LocalBoard</Text>
          <Text style={styles.tagline}>Apna Sheher. Apni Awaaz.</Text>
        </View>

        <View style={styles.card}>
          {step === "phone" ? (
            <>
              <Text style={styles.stepTitle}>Apna number enter karein</Text>
              <Text style={styles.stepSub}>OTP se login — bilkul free!</Text>
              <View style={styles.phoneRow}>
                <View style={styles.flagBox}>
                  <Text style={{ fontSize: 18 }}>🇮🇳</Text>
                  <Text style={styles.code}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.btn,
                  (!isValidPhone(phone) || loading) && styles.btnOff,
                ]}
                onPress={sendOTP}
                disabled={!isValidPhone(phone) || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.btnText}>OTP Bhejo</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setStep("phone")}
                style={{ marginBottom: 12 }}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              <Text style={styles.stepTitle}>OTP enter karein</Text>
              <Text style={styles.stepSub}>+91 {phone} pe bheja gaya</Text>
              <View style={styles.otpRow}>
                {otp.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => (refs.current[i] = r)}
                    style={[styles.otpBox, d && styles.otpBoxFilled]}
                    value={d}
                    onChangeText={(v) => onOtpChange(v.slice(-1), i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnOff]}
                onPress={verifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify Karein ✓</Text>
                )}
              </TouchableOpacity>
              {countdown > 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    color: COLORS.textMuted,
                    marginTop: 12,
                  }}
                >
                  Resend in {countdown}s
                </Text>
              ) : (
                <TouchableOpacity onPress={sendOTP}>
                  <Text
                    style={{
                      textAlign: "center",
                      color: COLORS.primary,
                      marginTop: 12,
                      fontWeight: "600",
                    }}
                  >
                    OTP dobara bhejo
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "22",
    borderWidth: 1,
    borderColor: COLORS.primary + "44",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  appName: {
    fontSize: SIZES.display,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  tagline: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontStyle: "italic",
    fontWeight: "500",
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepTitle: {
    fontSize: SIZES.heading,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SIZES.md,
    overflow: "hidden",
  },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  code: {
    fontSize: SIZES.bodyLg,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: SIZES.bodyLg,
    color: COLORS.textPrimary,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.lg,
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: COLORS.bgInput,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMd,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnOff: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: SIZES.bodyLg, fontWeight: "700" },
});
