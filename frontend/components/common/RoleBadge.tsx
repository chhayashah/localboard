import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES } from "../../constants/theme";
import { getRoleConfig } from "../../constants/helpers";

export default function RoleBadge({
  role,
  size = "sm",
}: {
  role: string;
  size?: "sm" | "lg";
}) {
  const c = getRoleConfig(role);
  if (role === "user") return null;
  const fs = size === "lg" ? 12 : 10;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.color + "22", borderColor: c.color + "44" },
      ]}
    >
      <Ionicons name={c.icon as any} size={fs} color={c.color} />
      <Text style={[styles.label, { color: c.color, fontSize: fs }]}>
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
  },
  label: { fontWeight: "600" },
});
