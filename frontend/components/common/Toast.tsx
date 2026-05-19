import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, SIZES } from "../../constants/theme";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastItem extends ToastConfig {
  id: number;
}

// Global toast function
let showToastFn: (config: ToastConfig) => void = () => {};

export const toast = {
  success: (message: string, duration = 3000) =>
    showToastFn({ message, type: "success", duration }),
  error: (message: string, duration = 3000) =>
    showToastFn({ message, type: "error", duration }),
  warning: (message: string, duration = 3000) =>
    showToastFn({ message, type: "warning", duration }),
  info: (message: string, duration = 3000) =>
    showToastFn({ message, type: "info", duration }),
};

const TOAST_CONFIG: Record<
  ToastType,
  { icon: string; color: string; bg: string }
> = {
  success: {
    icon: "checkmark-circle",
    color: COLORS.success,
    bg: COLORS.success + "20",
  },
  error: { icon: "close-circle", color: COLORS.error, bg: COLORS.error + "20" },
  warning: {
    icon: "warning",
    color: COLORS.warning,
    bg: COLORS.warning + "20",
  },
  info: {
    icon: "information-circle",
    color: COLORS.info,
    bg: COLORS.info + "20",
  },
};

function ToastItem({
  item,
  onHide,
}: {
  item: ToastItem;
  onHide: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const config = TOAST_CONFIG[item.type];

  useEffect(() => {
    // Fade in + slide down
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    const timer = setTimeout(() => hide(), item.duration || 3000);
    return () => clearTimeout(timer);
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onHide(item.id));
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: config.bg,
          borderColor: config.color + "50",
        },
      ]}
    >
      <Ionicons name={config.icon as any} size={20} color={config.color} />
      <Text
        style={[
          styles.toastText,
          { color: config.color === COLORS.warning ? "#fff" : config.color },
        ]}
        numberOfLines={3}
      >
        {item.message}
      </Text>
      <TouchableOpacity onPress={hide} style={styles.closeBtn}>
        <Ionicons name="close" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    showToastFn = (config: ToastConfig) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { ...config, id }]);
    };
    return () => {
      showToastFn = () => {};
    };
  }, []);

  const hideToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onHide={hideToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 55 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 2,
  },
});
