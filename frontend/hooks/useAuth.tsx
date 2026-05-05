import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authAPI } from "../services/api";

interface AuthCtx {
  user: any | null;
  isAuthenticated: boolean;
  loading: boolean;
  saveAuth: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: any) => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  isAuthenticated: false,
  loading: true,
  saveAuth: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restore();
  }, []);

  const restore = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res: any = await authAPI.getMe();
      if (res.success) setUser(res.user);
      else await AsyncStorage.multiRemove(["token", "user"]);
    } catch {
      await AsyncStorage.multiRemove(["token", "user"]);
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = useCallback(async (token: string, userData: any) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setUser(null);
  }, []);

  const updateUser = useCallback((u: any) => {
    setUser(u);
    AsyncStorage.setItem("user", JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        saveAuth,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
