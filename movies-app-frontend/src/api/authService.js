import axios from "axios";
import { navigationRef } from "@/utils/navigation";
import { clearStoredSession, readStoredSession, saveRedirectAfterLogin } from "@/utils/authSession";

// Base Axios instance for all auth-related requests.
const API = axios.create({
    baseURL: import.meta.env.VITE_AUTH_API_URL,
    headers: { "Content-Type": "application/json" },
    // Cookies now carry the JWT, so every auth request must include credentials.
    withCredentials: true,
});

// Redirect to login on 401 responses.
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            saveRedirectAfterLogin(window.location.pathname + window.location.search);
            clearStoredSession();
            navigationRef.navigate?.("/login", { replace: true });
        }
        return Promise.reject(error);
    }
);

// Separate instance for the /api/users endpoint.
const USERS_API = axios.create({
    baseURL: import.meta.env.VITE_USER_API_URL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
});

// Fetches the current user's profile from /api/users/me using the HttpOnly cookie.
// Used by LoginCallback to hydrate the AuthContext after the backend OAuth2 redirect.
export const getCurrentUser = () => USERS_API.get("/me");

// Legacy helpers kept for any remaining usages — can be removed later.
export const loginUser = (data) => API.post("/login",    data);
export const registerUser = (data) => API.post("/register", data);
export const logoutUser = () => API.post("/logout");

// Quick client-side guard — does NOT validate the cookie, it only reflects stored user identity.
export const isLoggedIn = () => Boolean(readStoredSession().user);
