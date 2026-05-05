import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "../constants/theme";
import { AuthProvider, useAuth } from "../hooks/useAuth";

function RootLayoutNav() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "auth";
    if (!isAuthenticated && !inAuth) router.replace("/auth/login");
    if (isAuthenticated && inAuth) router.replace("/(tabs)");
  }, [isAuthenticated, loading]);

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="profile/[id]" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="jobs/[id]" />
      <Stack.Screen name="jobs/create" />
      <Stack.Screen name="create" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      <RootLayoutNav />
    </AuthProvider>
  );
}
