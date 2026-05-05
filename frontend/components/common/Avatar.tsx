import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { getAvatarColor, getInitials } from "../../constants/helpers";
import { COLORS } from "../../constants/theme";

interface Props {
  user: any;
  size?: number;
  showBadge?: boolean;
}

export default function Avatar({ user, size = 36, showBadge = false }: Props) {
  const initials = getInitials(user?.name || "?");
  const bgColor = getAvatarColor(user?.name || "");
  const radius = size * 0.3;
  const badgeSize = size * 0.32;

  return (
    <View style={{ width: size, height: size }}>
      {user?.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: bgColor + "28",
              borderColor: bgColor + "60",
            },
          ]}
        >
          <Text
            style={[styles.initials, { fontSize: size * 0.35, color: bgColor }]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showBadge && user?.isVerified && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: -1,
              right: -1,
            },
          ]}
        >
          <Text style={{ fontSize: badgeSize * 0.65 }}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  initials: { fontWeight: "800" },
  badge: {
    position: "absolute",
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
});
