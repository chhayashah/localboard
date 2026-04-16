import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import {
  getInitials,
  getAvatarColor,
  getRoleConfig,
} from "../../constants/helpers";

interface Props {
  user: any;
  size?: number;
  showBadge?: boolean;
}

export default function Avatar({ user, size = 40, showBadge = true }: Props) {
  if (!user) return null;
  const rc = getRoleConfig(user.role);
  const bSz = size * 0.38;

  return (
    <View style={{ width: size, height: size }}>
      {user.avatar ? (
        <Image
          source={{ uri: user.avatar }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getAvatarColor(user.name),
            },
          ]}
        >
          <Text
            style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.38 }}
          >
            {getInitials(user.name)}
          </Text>
        </View>
      )}
      {showBadge && (user.isVerified || user.role !== "user") && (
        <View
          style={[
            styles.badge,
            {
              width: bSz,
              height: bSz,
              borderRadius: bSz / 2,
              backgroundColor: rc.color,
            },
          ]}
        >
          <Ionicons
            name={user.isVerified ? "checkmark" : (rc.icon as any)}
            size={bSz * 0.6}
            color="#fff"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: "center", alignItems: "center" },
  badge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.bgCard,
  },
});
