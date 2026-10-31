import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { consumeRedirectAfterLogin } from "@/utils/authSession";
import { useAuth } from "@/components/context/AuthContext";
/**
 * Landing page after the backend OAuth2 redirect flow completes.
 *
 * The backend sets the HttpOnly JWT cookie before redirecting here.
 * This page reads user metadata, confirms the session is active with /api/users/me,
 * then updates AuthContext and navigates to the target page.
 */
export default function LoginCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshSession, persist } = useAuth();
    const executedRef = useRef(false);
    useEffect(() => {
        if (executedRef.current) return;
        executedRef.current = true;
        const status = searchParams.get("status");
        const username = searchParams.get("username");
        const fullName = searchParams.get("fullName");
        if (status !== "success") {
            toast.error("Google sign-in failed. Please try again.");
            return;
        }
        // The JWT cookie was already set by the backend OAuth2 success handler.
        // Refresh the in-memory session so the rest of the app knows the user is logged in.
        refreshSession()
        // 1. If username was provided in the callback query, immediately store it
        if (username) {
            persist(username, fullName || "");
        }
        // 2. Verify cookie & sync profile with backend, then proceed
        refreshSession(username, fullName)
            .then(() => {
                toast.success("Signed in with Google!");
                navigate(consumeRedirectAfterLogin() || "/", { replace: true });
            })
            .catch(() => {
                if (username) {
                    toast.success("Signed in with Google!");
                    navigate(consumeRedirectAfterLogin() || "/", { replace: true });
                } else {
                    toast.error("Could not restore your session. Please try again.");
                    navigate("/login", { replace: true });
                }
            });
    }, [searchParams, navigate, persist, refreshSession]);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
            <Spinner size={32} />
            <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
    );
}