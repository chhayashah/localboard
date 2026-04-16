import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SIZES } from "../../constants/theme";
import { jobsAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import JobCard from "../../components/jobs/JobCard";
import { JOB_CATEGORIES } from "../../constants/helpers";

export default function JobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJobs = useCallback(
    async (pageNum = 1, refresh = false) => {
      try {
        const params: any = { page: pageNum, limit: 10 };
        if (category !== "all") params.category = category;
        const res: any = await jobsAPI.getJobs(params);
        if (res.success) {
          if (refresh || pageNum === 1) setJobs(res.jobs);
          else setJobs((p) => [...p, ...res.jobs]);
          setHasMore(res.pagination.hasMore);
          setPage(pageNum);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [category],
  );

  useEffect(() => {
    setLoading(true);
    fetchJobs(1, true).finally(() => setLoading(false));
  }, [category]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Local Jobs</Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
            📍 {user?.location?.ward}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => router.push("/jobs/create")}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.postBtnText}>Job Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cats}
      >
        {JOB_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.chip, category === c.value && styles.chipActive]}
            onPress={() => setCategory(c.value)}
          >
            <Text
              style={[
                styles.chipText,
                category === c.value && styles.chipTextActive,
              ]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/jobs/${item._id}`)}
            />
          )}
          contentContainerStyle={{ padding: SIZES.screenPadding }}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 48 }}>💼</Text>
              <Text
                style={{
                  fontSize: SIZES.title,
                  fontWeight: "700",
                  color: COLORS.textPrimary,
                }}
              >
                Koi Job Nahi
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ padding: 20 }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchJobs(1, true);
                setRefreshing(false);
              }}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              setLoadingMore(true);
              fetchJobs(page + 1).finally(() => setLoadingMore(false));
            }
          }}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.heading,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
  },
  postBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cats: { paddingHorizontal: SIZES.screenPadding, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { color: "#fff", fontWeight: "700" },
});
