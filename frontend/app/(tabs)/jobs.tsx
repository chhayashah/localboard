import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import JobCard from "../../components/jobs/JobCard";
import { JOB_CATEGORIES } from "../../constants/helpers";
import { COLORS, SIZES } from "../../constants/theme";
import { jobsAPI } from "../../services/api";

export default function JobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    load(true);
  }, [category]);

  const load = async (reset = false) => {
    try {
      const params: any = { limit: 20, page: 1 };
      if (category !== "all") params.category = category;
      const res: any = await jobsAPI.getJobs(params);
      if (res.success) setJobs(res.jobs);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = jobs.filter((j) =>
    search
      ? j.title?.toLowerCase().includes(search.toLowerCase()) ||
        j.description?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            <Text style={{ color: COLORS.textPrimary }}>Local</Text>
            <Text style={{ color: COLORS.primary }}>Jobs</Text>
            {"  💼"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.postJobBtn}
          onPress={() => router.push("/jobs/create")}
        >
          <Ionicons name="add" size={16} color="#000" />
          <Text style={styles.postJobText}>Job Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Job dhundo..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <FlatList
        data={JOB_CATEGORIES}
        keyExtractor={(item) => item.value}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              category === item.value && styles.filterChipOn,
            ]}
            onPress={() => setCategory(item.value)}
          >
            <Text
              style={[
                styles.filterText,
                category === item.value && styles.filterTextOn,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/jobs/${item._id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>💼</Text>
              <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>
                Koi job nahi mili
              </Text>
              <Text
                style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}
              >
                Pehli job post karo — free hai!
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  postJobBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
  },
  postJobText: { fontSize: 12, fontWeight: "800", color: "#000" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: COLORS.bgInput,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  filterList: { paddingHorizontal: 14, paddingBottom: 10, gap: 7 },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  filterChipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  filterTextOn: { color: "#000" },
  list: { paddingHorizontal: 14, paddingBottom: 30 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { padding: 50, alignItems: "center" },
});
