import axios from "axios";
import { serverStatusRef } from "../utils/statusRef";

// Base Axios instance for all TMDB-proxied requests through the backend.
// Centralizing this means the base URL only needs to be changed in one place.
export const tmdb = axios.create({
  baseURL: import.meta.env.VITE_TMDB_API_URL || "http://localhost:8080/api/tmdb",
});

/**
 * Axios instance scoped to the watchlist groups API.
 * Mirrors the same JWT interceptor pattern used by the tmdb instance
 * so all authenticated requests attach the Bearer token automatically.
 */
export const watchlistGroupApi = axios.create({
    baseURL: `${import.meta.env.VITE_WATCHLIST_API_URL || "http://localhost:8080/api/watchlist"}/groups`,
});

// Attach the JWT token to every outgoing request if one exists in localStorage.
watchlistGroupApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses — clear stale session and redirect to login.
watchlistGroupApi.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// Attach the JWT token to every outgoing TMDB request if one exists in localStorage.
// This means callers never need to manually pass the Authorization header.
tmdb.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler for all TMDB requests.
// Maps network failures and HTTP error codes to structured error states
// so the UI can display a consistent error screen without per-call handling.
tmdb.interceptors.response.use(
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
      // 404 means the requested resource doesn't exist on the backend or TMDB.
      setError({
        type: "NOT_FOUND",
        title: "Not Found",
        message: "The requested resource does not exist.",
      });
    } else if (status === 401) {
      // 401 means the JWT token is missing, expired, or invalid.
      // Clear the stale session so the user is prompted to log in again.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else if (status >= 500) {
      // 5xx errors indicate an unrecoverable failure on the server side.
      setError({
        type: "SERVER_ERROR",
        title: "Server Error",
        message: "Something went wrong on the server.",
      });
    }

    return Promise.reject(error);
  }
);