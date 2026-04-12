import axios from "axios";

// Base Axios instance for all auth-related requests.
// Centralizing this means the base URL and headers only need to be changed in one place.
const API = axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL || "http://localhost:8080/api/auth",
    headers: {"Content-Type": "application/json"},
});

// Attach the JWT token to every outgoing request if one exists in localStorage.
// This means callers never need to manually pass the Authorization header.
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Automatically redirect to the login page on 401 Unauthorized responses.
// This handles token expiry globally without each caller needing to check for it.
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// Sends login credentials and returns the server response.
export const loginUser = (data) => API.post("/login", data);

// Sends registration data and returns the server response.
export const registerUser = (data) => API.post("/register", data);

// Sends a logout request to invalidate the session on the server side.
export const logoutUser = () => API.post("/logout");

// Checks whether a token exists in localStorage as a quick client-side auth guard.
// Note: this does not verify the token's validity or expiry — that is handled server-side.
export const isLoggedIn = () => !!localStorage.getItem("token");