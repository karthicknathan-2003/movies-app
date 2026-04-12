import { loginUser, registerUser } from "@/api/authService";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Context instance — consumed via the useAuth hook rather than directly.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Start as true so children are blocked from rendering until auth is restored.
    const [loading, setLoading] = useState(true);

    /* Restore auth state from localStorage on mount.
       Runs once so the user stays logged in across page refreshes. */
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        // Only restore state if both values are present — avoids a partially hydrated auth state.
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
        }

        // Mark loading as done regardless of whether a session was found.
        setLoading(false);
    }, []);

    /* Authenticate with credentials, persist the session, and update state.
       Re-throws on failure so the calling component can handle form-level feedback. */
    const login = useCallback(async (credentials) => {
        try {
            const res = await loginUser(credentials);
            const { token, userName } = res.data;

            // Persist to localStorage so the session survives a page refresh.
            localStorage.setItem("token", token);
            localStorage.setItem("user", userName);

            setToken(token);
            setUser(userName);
        } catch (error) {
            toast.error("Login failed. Please check your credentials.");
            throw error;
        }
    }, []);

    /* Register a new account — does not log the user in automatically.
       Re-throws on failure so the calling component can handle form-level feedback. */
    const register = useCallback(async (data) => {
        try {
            await registerUser(data);
            toast.success("Registration successful! Please log in.");
        } catch (error) {
            toast.error("Registration failed. Please try again.");
            throw error;
        }
    }, []);

    /* Clear all auth state and remove persisted session data.
       After this runs, isAuthenticated will be false and protected routes will redirect. */
    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
    }, []);

    /* Memoize the context value to prevent unnecessary re-renders in consumers
       when unrelated state changes occur higher up in the tree. */
    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated: !!token, // Derived boolean — avoids consumers checking token directly.
        login,
        register,
        logout,
    }), [user, token, login, register, logout]);

    // Block rendering children until the stored session has been restored.
    // This prevents a flash where the app briefly treats the user as logged out.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Convenience hook — throws a clear error if used outside of AuthProvider.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }
    return context;
};