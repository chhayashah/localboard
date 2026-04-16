import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES } from "../../constants/theme";
import { postsAPI } from "../../services/api";
import Avatar from "../../components/common/Avatar";
import { formatCount } from "../../constants/helpers";

const { width: W, height: H } = Dimensions.get("window");

function ReelItem({ item, isActive }: any) {
  const router = useRouter();
  const videoRef = useRef<any>(null);
  const [liked, setLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    isActive && !paused
      ? videoRef.current.playAsync()
      : videoRef.current.pauseAsync();
  }, [isActive, paused]);

  const handleLike = async () => {
    const prev = liked;
    setLiked(!liked);
    setLikeCount((c: number) => (!liked ? c + 1 : c - 1));
    try {
      await postsAPI.likePost(item._id);
    } catch {
      setLiked(prev);
      setLikeCount((c: number) => (prev ? c - 1 : c + 1));
    }
  };

  return (
    <View style={{ width: W, height: H }}>
      {item.mediaUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: item.mediaUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted={muted}
          shouldPlay={isActive && !paused}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#111",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text style={{ fontSize: 60 }}>🎬</Text>
        </View>
      )}

      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={() => setPaused((p) => !p)}
        activeOpacity={1}
      >
        {paused && (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name="play" size={64} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </TouchableOpacity>

      <LinearGradient
        colors={["transparent", "transparent", "rgba(0,0,0,0.85)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.top}>
        <Text
          style={{ color: "#fff", fontSize: SIZES.bodyLg, fontWeight: "800" }}
        >
          🎬 Reels
        </Text>
        <TouchableOpacity onPress={() => setMuted((m) => !m)}>
          <Ionicons
            name={muted ? "volume-mute" : "volume-high"}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.rightAct}>
        {[
          {
            icon: liked ? "heart" : "heart-outline",
            color: liked ? COLORS.error : "#fff",
            label: formatCount(likeCount),
            onPress: handleLike,
          },
          {
            icon: "chatbubble-outline",
            color: "#fff",
            label: formatCount(item.comments?.length || 0),
            onPress: () => router.push(`/post/${item._id}`),
          },
          {
            icon: "arrow-redo-outline",
            color: "#fff",
            label: "Share",
            onPress: () => {},
          },
        ].map((a, i) => (
          <TouchableOpacity
            key={i}
            onPress={a.onPress}
            style={{ alignItems: "center", gap: 3 }}
          >
            <Ionicons name={a.icon as any} size={30} color={a.color} />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          onPress={() => router.push(`/profile/${item.user?._id}`)}
        >
          <Avatar user={item.user} size={36} />
          <View>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {item.user?.name}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              📍 {item.user?.location?.ward}
            </Text>
          </View>
        </TouchableOpacity>
        {!!item.content && (
          <Text
            style={{ color: "#fff", fontSize: SIZES.body, marginTop: 6 }}
            numberOfLines={2}
          >
            {item.content}
          </Text>
        )}
        {item.hashtags?.length > 0 && (
          <Text
            style={{ color: COLORS.primary, fontWeight: "600", marginTop: 4 }}
          >
            {item.hashtags.slice(0, 3).join(" ")}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  const load = async (p = 1) => {
    try {
      const res: any = await postsAPI.getReels(p);
      if (res.success) {
        if (p === 1) setReels(res.reels);
        else setReels((prev) => [...prev, ...res.reels]);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  };

  const onViewable = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActive(viewableItems[0].index ?? 0);
  }, []);

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  if (!reels.length)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 48 }}>🎬</Text>
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: SIZES.title,
            fontWeight: "700",
          }}
        >
          Koi Reel Nahi
        </Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        data={reels}
        keyExtractor={(i) => i._id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === active} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onEndReached={() => load(page + 1)}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, i) => ({ length: H, offset: H * i, index: i })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
  },
  rightAct: {
    position: "absolute",
    right: 14,
    bottom: 130,
    gap: 24,
    alignItems: "center",
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 80,
    bottom: 0,
    padding: SIZES.md,
  },
});
