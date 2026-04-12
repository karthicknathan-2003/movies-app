import axios from "axios";
import { serverStatusRef } from "../utils/statusRef";
import { navigationRef } from "@/utils/navigation";

// Base Axios instance for all watchlist-related requests through the backend.
// Centralizing this means the base URL only needs to be changed in one place.
export const watchlistApi = axios.create({
  baseURL: import.meta.env.VITE_WATCHLIST_API_URL || "http://localhost:8080/api/watchlist",
});

// Attach the JWT token to every outgoing watchlist request if one exists in localStorage.
// Explicitly deletes the header when no token is present to prevent stale values
// from persisting across requests if the user logs out mid-session.
watchlistApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Global error handler for all watchlist requests.
// Maps network failures and HTTP error codes to structured error states
// so the UI can display a consistent error screen without per-call handling.
watchlistApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const setError = serverStatusRef.setErrorState;

    // No response object means the request never reached the server —
    // this covers backend downtime, CORS failures, and network issues.
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        // ECONNABORTED specifically indicates a timeout — distinct from the server being down.
        setError({
          type: "TIMEOUT",
          title: "Request Timed Out",
          message: "The server is taking too long to respond.",
        });
      } else {
        setError({
          type: "SERVER_DOWN",
          title: "Service Unavailable",
          message: "Server is unreachable.",
        });
      }

      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 404) {
      // 404 on watchlist endpoints means the item doesn't exist yet —
      // callers that expect this (e.g. status checks) should catch it themselves.
      setError({
        type: "NOT_FOUND",
        title: "Not Found",
        message: "The requested resource does not exist.",
      });
    } else if (status === 401) {
      // 401 means the JWT token is missing, expired, or invalid.
      // Clear both token and user so the app treats the session as fully ended.
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setError({
        type: "UNAUTHORIZED",
        title: "Unauthorized",
        message: "Your session has expired. Please log in again.",
      });

      // Store the current path so the user is redirected back after logging in.
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem("redirectAfterLogin", currentPath);

      // Use navigationRef to avoid a full page reload — keeps the React tree intact.
      navigationRef.navigate?.("/login", { replace: true });
    } else if (status >= 500) {
      // 5xx errors indicate an unrecoverable failure on the server side.
      setError({
        type: "SERVER_ERROR",
        title: "Server Error",
        message: "Something went wrong on the server.",
      });
    }

    return Promise.reject(error);
  },
);
