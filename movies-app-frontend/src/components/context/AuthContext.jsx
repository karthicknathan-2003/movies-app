import { googleLogin, loginUser, logoutUser, registerUser } from "@/api/authService";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { clearStoredSession, persistSession, readStoredSession } from "@/utils/authSession";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(() => {
        const storedSession = readStoredSession();

        return {
            user: storedSession.user,
            fullName: storedSession.fullName,
            token: storedSession.token,
        };
    });

    // Persist a successful auth response.
    const persist = useCallback((userName, fullName) => {
        // The backend stores the JWT in an HttpOnly cookie, so only user-facing identity is cached here.
        persistSession({ userName, fullName });
        setSession({
            user: userName,
            fullName,
            token: null,
        });
    }, []);

    /**
     * Authenticate with a Google ID token.
     * Called from the login page after the Google button fires onSuccess.
     */
    const loginWithGoogle = useCallback(async (credential) => {
        try {
            const res = await googleLogin(credential);
            const { fullName, userName } = res.data;
            persist(userName, fullName);
        } catch (error) {
            const message = error.response?.data?.message || "Google sign-in failed. Please try again.";
            toast.error(message);
            throw error;
        }
    }, [persist]);

    // Legacy email/password login — kept for backward compatibility.
    const login = useCallback(async (credentials) => {
        try {
            const res = await loginUser(credentials);
            const { fullName, userName } = res.data;
            persist(userName, fullName);
        } catch (error) {
            const message = error.response?.data?.message || "Login failed. Please check your credentials.";
            toast.error(message);
            throw error;
        }
    }, [persist]);

    const register = useCallback(async (data) => {
        try {
            await registerUser(data);
            toast.success("Registration successful! Please log in.");
        } catch (error) {
            const message = error.response?.data?.message || "Registration failed. Please try again.";
            toast.error(message);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // Ask the backend to expire the HttpOnly auth cookie before clearing local identity fields.
            await logoutUser();
        } catch {
            // Even if the request fails, clearing local identity keeps the UI from appearing logged in.
        } finally {
            clearStoredSession();
            setSession({
                user: null,
                fullName: null,
                token: null,
            });
        }
    }, []);

    const value = useMemo(() => ({
        user: session.user,
        fullName: session.fullName,
        token: session.token,
        isAuthenticated: Boolean(session.user),
        loginWithGoogle,
        login,
        register,
        logout,
    }), [session, loginWithGoogle, login, register, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider.");
    return context;
};