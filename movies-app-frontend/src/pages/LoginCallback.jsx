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
    const { refreshSession } = useAuth();
    const executedRef = useRef(false);

    useEffect(() => {
        if (executedRef.current) return;
        executedRef.current = true;
        const status = searchParams.get("status");
        if (status !== "success") {
            toast.error("Google sign-in failed. Please try again.");
            navigate("/login", { replace: true });
            return;
        }
        // The JWT cookie was set by the backend OAuth2 success handler.
        // Verify active session with backend and hydrate context.
        refreshSession()
            .then(() => {
                toast.success("Signed in with Google!");
                navigate(consumeRedirectAfterLogin() || "/", { replace: true });
            }).catch(() => {
                toast.error("Could not restore your session. Please try again.");
                navigate("/login", { replace: true });
            });
    }, [searchParams, navigate, refreshSession]);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
            <Spinner size={32} />
            <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
    );
}