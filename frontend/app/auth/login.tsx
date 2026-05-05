import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isValidEmail, isValidPhone } from "../../constants/helpers";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveAuth } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

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

  const handleSendOTP = async () => {
    if (!isValidPhone(phone) && !isValidEmail(phone))
      return Alert.alert("Invalid", "Sahi phone number ya email daalo");
    setLoading(true);
    try {
      const res: any = await authAPI.sendOTP(phone);
      if (res.success) {
        setStep("otp");
        startTimer();
        if (res.otp) Alert.alert("Dev Mode OTP", res.otp);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return Alert.alert("Invalid", "6-digit OTP daalo");
    setLoading(true);
    try {
      const res: any = await authAPI.verifyOTP(phone, otp);
      if (res.success) {
        if (res.isNewUser) {
          router.push({ pathname: "/auth/signup", params: { phone } });
        } else {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🏙️</Text>
          <Text style={styles.logo}>
            <Text style={{ color: COLORS.textPrimary }}>Local</Text>
            <Text style={{ color: COLORS.primary }}>Board</Text>
          </Text>
          <Text style={styles.tagline}>Apna Sheher. Apni Awaaz.</Text>
        </View>

        <View style={styles.card}>
          {step === "phone" ? (
            <>
              <Text style={styles.cardTitle}>Login / Register</Text>
              <Text style={styles.cardSub}>
                Apna phone number ya email daalo
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Phone / Email</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="9876543210 ya email@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnText}>OTP Bhejo →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setStep("phone")}
                style={styles.backRow}
              >
                <Text style={styles.backText}>← Wapas</Text>
              </TouchableOpacity>
              <Text style={styles.cardTitle}>OTP Daalo</Text>
              <Text style={styles.cardSub}>{phone} pe OTP bheja gaya</Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>6-digit OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={COLORS.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnText}>Verify Karo ✓</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendRow}
                onPress={timer === 0 ? handleSendOTP : undefined}
                disabled={timer > 0}
              >
                <Text
                  style={[
                    styles.resendText,
                    timer > 0 && { color: COLORS.textMuted },
                  ]}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "OTP dobara bhejo"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Login karke aap hamare Terms & Privacy Policy se agree karte hain
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, alignItems: "center" },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoEmoji: { fontSize: 52, marginBottom: 8 },
  logo: { fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  tagline: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  backRow: { marginBottom: 16 },
  backText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  inputWrap: { marginBottom: 18 },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  flag: { fontSize: 18, marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 13,
  },
  otpInput: {
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: "800",
    flex: 1,
    paddingVertical: 13,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnText: { fontSize: 16, fontWeight: "800", color: "#000" },
  resendRow: { alignItems: "center", marginTop: 16 },
  resendText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  footer: {
    marginTop: 28,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
});
