import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getRoleConfig } from "../../constants/helpers";
import { SIZES } from "../../constants/theme";

interface Props {
  role: string;
  size?: "sm" | "md" | "lg";
}

export default function RoleBadge({ role, size = "sm" }: Props) {
  if (!role || role === "user") return null;
  const config = getRoleConfig(role);
  const fontSize = size === "lg" ? 10 : size === "md" ? 9 : 8;
  const px = size === "lg" ? 9 : 7;
  const py = size === "lg" ? 4 : 2;

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: px,
          paddingVertical: py,
          backgroundColor: config.color + "20",
          borderColor: config.color + "40",
        },
      ]}
    >
      <Text style={[styles.text, { fontSize, color: config.color }]}>
        {config.emoji} {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
});
