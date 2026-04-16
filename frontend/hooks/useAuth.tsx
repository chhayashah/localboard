import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

interface User {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
  bio?: string;
  role: string;
  isVerified: boolean;
  location: { city: string; ward: string; pincode: string };
  postCount: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  saveAuth: (token: string, user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const [[, t], [, u]] = await AsyncStorage.multiGet(["token", "user"]);
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
        try {
          const res: any = await authAPI.getMe();
          if (res.success) {
            setUser(res.user);
            await AsyncStorage.setItem("user", JSON.stringify(res.user));
          }
        } catch {
          await clearAll();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = async (newToken: string, newUser: User) => {
    await AsyncStorage.multiSet([
      ["token", newToken],
      ["user", JSON.stringify(newUser)],
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const clearAll = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setToken(null);
    setUser(null);
  };

  const updateUser = async (updated: User) => {
    setUser(updated);
    await AsyncStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        saveAuth,
        updateUser,
        logout: clearAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
