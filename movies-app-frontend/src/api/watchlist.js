import axios from "axios";
import { navigationRef } from "../utils/navigation";
import { clearStoredSession, readToken, saveRedirectAfterLogin } from "@/utils/authSession";

// Base Axios instance for all watchlist-related requests through the backend.
// Centralizing this means the base URL only needs to be changed in one place.
export const watchlistApi = axios.create({
  baseURL: import.meta.env.VITE_WATCHLIST_API_URL || "http://localhost:8080/api/watchlist",
});

// Attach the JWT token to every outgoing watchlist request if one exists in localStorage.
// Explicitly deletes the header when no token is present to prevent stale values
// from persisting across requests if the user logs out mid-session.
watchlistApi.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Global error handler for all watchlist requests.
// Handles authentication errors by clearing session and redirecting to login.
watchlistApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // 401 means the JWT token is missing, expired, or invalid.
      // Clear both token and user so the app treats the session as fully ended.
      clearStoredSession();

      // Store the current path so the user is redirected back after logging in.
      const currentPath = window.location.pathname + window.location.search;
      saveRedirectAfterLogin(currentPath);

      // Use navigationRef to avoid a full page reload — keeps the React tree intact.
      navigationRef.navigate?.("/login", { replace: true });
    }

    return Promise.reject(error);
  },
);
