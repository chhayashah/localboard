import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.100:5000/api";

const request = async (
  method: string,
  path: string,
  body?: any,
  isForm = false,
) => {
  const token = await AsyncStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const get = (path: string) => request("GET", path);
const post = (path: string, body?: any) => request("POST", path, body);
const put = (path: string, body?: any) => request("PUT", path, body);
const patch = (path: string, body?: any) => request("PATCH", path, body);
const del = (path: string) => request("DELETE", path);
const postForm = (path: string, f: FormData) => request("POST", path, f, true);
const putForm = (path: string, f: FormData) => request("PUT", path, f, true);

export const authAPI = {
  sendOTP: (phone: string) => post("/auth/send-otp", { phone }),
  verifyOTP: (phone: string, otp: string) =>
    post("/auth/verify-otp", { phone, otp }),
  signup: (data: any) => post("/auth/signup", data),
  getMe: () => get("/auth/me"),
};

export const postsAPI = {
  createPost: (form: FormData) => postForm("/posts/create", form),
  getFeed: (params: any) => get(`/posts?${new URLSearchParams(params)}`),
  getPost: (id: string) => get(`/posts/${id}`),
  likePost: (id: string) => post(`/posts/${id}/like`),
  addComment: (id: string, text: string) =>
    post(`/posts/${id}/comment`, { text }),
  deletePost: (id: string) => del(`/posts/${id}`),
  getReels: (page = 1) => get(`/posts/reels?page=${page}`),
  getTrending: () => get("/posts/trending"),
  sharePost: (id: string) => post(`/posts/${id}/share`),
};

export const jobsAPI = {
  createJob: (data: any) => post("/jobs/create", data),
  getJobs: (params: any) => get(`/jobs?${new URLSearchParams(params)}`),
  getJob: (id: string) => get(`/jobs/${id}`),
  deleteJob: (id: string) => del(`/jobs/${id}`),
  toggleJobStatus: (id: string) => patch(`/jobs/${id}/toggle`),
};

export const usersAPI = {
  getProfile: (id: string) => get(`/users/${id}`),
  updateProfile: (form: FormData) => putForm("/users/update", form),
  followUser: (id: string) => post(`/users/${id}/follow`),
  getNotifications: () => get("/users/notifications"),
  searchUsers: (q: string) => get(`/users/search?q=${encodeURIComponent(q)}`),
  getLocalLeaders: () => get("/users/leaders"),
};
