import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import {
  getInitials,
  getAvatarColor,
  getRoleConfig,
} from "../../constants/helpers";
import { COLORS } from "../../constants/theme";

interface Props {
  user: any;
  size?: number;
  showBadge?: boolean;
}

export default function Avatar({ user, size = 36, showBadge = false }: Props) {
  const initials = getInitials(user?.name || "?");
  const radius = size * 0.28;
  const badgeSize = size * 0.32;

  // Use role color if user has a special role
  const roleConfig = getRoleConfig(user?.role);
  const hasRole = user?.role && user.role !== "user";

  // Color: role-based for special roles, name-hash for regular users
  const bgColor = hasRole ? roleConfig.color : getAvatarColor(user?.name || "");

  return (
    <View style={{ width: size, height: size }}>
      {user?.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
          }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: bgColor + "22",
              borderColor: bgColor + "55",
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.36,
                color: bgColor,
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Verified badge */}
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
          <Text style={{ fontSize: badgeSize * 0.6, color: "#fff" }}>✓</Text>
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
  initials: {
    fontWeight: "800",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
});
