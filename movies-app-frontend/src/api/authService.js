import axios from "axios";
import { clearStoredSession, readToken } from "@/utils/authSession";

// Base Axios instance for all auth-related requests.
const API = axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL || "http://localhost:8080/api/auth",
    headers: { "Content-Type": "application/json" },
});

// Attach the JWT token to every outgoing request if one exists.
API.interceptors.request.use((config) => {
    const token = readToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Redirect to login on 401 responses.
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearStoredSession();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// Sends the Google ID token to the backend and gets an app JWT back.
export const googleLogin = (credential) =>
    API.post("/google", { credential });

// Legacy helpers kept for any remaining usages — can be removed later.
export const loginUser    = (data) => API.post("/login",    data);
export const registerUser = (data) => API.post("/register", data);
export const logoutUser   = ()     => API.post("/logout");

// Quick client-side guard — does NOT validate the JWT.
export const isLoggedIn = () => Boolean(readToken());
