import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../components/common/Avatar";
import { timeAgo } from "../constants/helpers";
import { COLORS } from "../constants/theme";
import { usersAPI } from "../services/api";

const NOTIF_ICONS: Record<string, string> = {
  like: "❤️",
  comment: "💬",
  follow: "👤",
  mention: "@",
  reply: "↩️",
  news: "📰",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res: any = await usersAPI.getNotifications();
      if (res.success) setNotifs(res.notifications);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifItem, !item.isRead && styles.notifUnread]}
              onPress={() => item.post && router.push(`/post/${item.post._id}`)}
            >
              <View style={styles.notifIcon}>
                <Text style={{ fontSize: 16 }}>
                  {NOTIF_ICONS[item.type] || "🔔"}
                </Text>
              </View>
              <Avatar user={item.sender} size={40} showBadge />
              <View style={styles.notifText}>
                <Text style={styles.notifMsg}>{item.message}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>🔔</Text>
              <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>
                Koi notification nahi abhi
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notifUnread: { backgroundColor: COLORS.primary + "08" },
  notifIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  notifText: { flex: 1 },
  notifMsg: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    fontWeight: "500",
  },
  notifTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  empty: { padding: 60, alignItems: "center" },
});
