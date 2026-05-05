import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/common/Avatar";
import RoleBadge from "../../components/common/RoleBadge";
import { formatCount } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";
import { usersAPI } from "../../services/api";

const TRENDING_TAGS = [
  "#JabalpurVibes",
  "#Ward12",
  "#LocalJobs",
  "#NapierTown",
  "#LocalMeme",
  "#NaliRepair",
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    try {
      const res: any = await usersAPI.getLocalLeaders();
      if (res.success) setLeaders(res.leaders);
    } catch {}
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res: any = await usersAPI.searchUsers(search);
      if (res.success) setUsers(res.users);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const UserRow = ({ item }: any) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push(`/profile/${item._id}`)}
    >
      <Avatar user={item} size={46} showBadge />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userMeta}>
          📍 {item.location?.ward} · {formatCount(item.followers?.length || 0)}{" "}
          followers
        </Text>
      </View>
      <RoleBadge role={item.role} size="md" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Explore</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Creator, ward, topic dhundo..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch}>
          <Text style={styles.searchBtn}>Dhundo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searched ? users : leaders}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Trending tags */}
            <Text style={styles.sectionLabel}>🔥 Trending Tags</Text>
            <View style={styles.tagsRow}>
              {TRENDING_TAGS.map((t) => (
                <TouchableOpacity key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>
              {searched
                ? `Results for "${search}"`
                : "🏅 Local Leaders & Creators"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => <UserRow item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ padding: 30 }} />
          ) : searched ? (
            <View style={styles.empty}>
              <Text style={{ color: COLORS.textMuted }}>Koi nahi mila 😕</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: COLORS.bgInput,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  searchBtn: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  list: { paddingHorizontal: 14, paddingBottom: 30 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 10,
    marginTop: 4,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  tag: {
    backgroundColor: COLORS.primary + "12",
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  tagText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  userName: {
    fontSize: SIZES.body,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  userMeta: { fontSize: SIZES.caption, color: COLORS.textMuted },
  empty: { padding: 40, alignItems: "center" },
});
