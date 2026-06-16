import axios from "axios";
import { navigationRef } from "../utils/navigation";
import {
  clearStoredSession,
  saveRedirectAfterLogin,
} from "@/utils/authSession";
import { toast } from "sonner";

// Base Axios instance for all watchlist-related requests through the backend.
// Centralizing this means the base URL only needs to be changed in one place.
export const watchlistApi = axios.create({
  baseURL: import.meta.env.VITE_WATCHLIST_API_URL,
  // Include the HttpOnly auth cookie on every watchlist request.
  withCredentials: true,
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

      // Surface the auth expiry instead of letting downstream callers fail quietly.
      toast.error(
        error.response?.data?.message ||
          "Session expired. Please log in again.",
      );

      // Use navigationRef to avoid a full page reload.
      navigationRef.navigate?.("/login", { replace: true });
    }

    return Promise.reject(error);
  },
);

// Episode progress helpers keep the per-episode API usage consistent across detail pages.
export const getEpisodeProgress = (movieId) =>
  watchlistApi.get(`/${movieId}/episodes/progress`);

export const updateEpisodeProgress = (movieId, payload) =>
  watchlistApi.put(`/${movieId}/episodes/progress`, payload);

// Personal star rating lives on the same watchlist record as favorite and watch status.
export const updatePersonalRating = (movieId, personalRating) =>
  watchlistApi.patch(`/${movieId}/rating`, null, {
    params: personalRating == null ? {} : { personalRating },
  });
