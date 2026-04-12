import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";

export default function LoginCard() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // Read the intended destination once on mount — defaults to home if none was stored.
    const from = sessionStorage.getItem("redirectAfterLogin") || "/";

    /* Handles login submission — delegates auth logic to the AuthContext.
       Redirects to the originally intended page on success and clears the stored path.
       Error toasts are handled here; the AuthContext re-throws to allow this catch to run. */
    const handleLogin = useCallback(async () => {
        // Prevent submission if either field is empty.
        if (!userName.trim() || !password.trim()) {
            toast.error("Please enter your username and password.");
            return;
        }

        setLoading(true);
        try {
            await login({ userName, password });
            toast.success("Logged in successfully!");

            // Replace the current history entry so the user can't go back to the login page.
            navigate(from, { replace: true });

            // Clear the stored redirect path to prevent stale redirects on future logins.
            sessionStorage.removeItem("redirectAfterLogin");
        } catch {
            // AuthContext already shows a toast — no duplicate error handling needed here.
        } finally {
            setLoading(false);
        }
    }, [userName, password, login, navigate, from]);

    // Allow form submission via the Enter key for better accessibility.
    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to continue to CineVault.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="userName">Email or Username</Label>
                        <Input
                            id="userName"
                            type="text" // Fixed from "name" which is not a valid input type.
                            placeholder="Email or Username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="username"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="current-password"
                            showPasswordToggle={true}
                            disabled={loading}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleLogin}
                        // Disable while loading or if fields are empty to prevent dead submissions.
                        disabled={loading || !userName.trim() || !password.trim()}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2 justify-center">
                                <Spinner size={20} color="white" /> Signing In...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Don't have an account?{" "}
                        <NavLink to="/signup" className="text-primary hover:underline">
                            Sign up
                        </NavLink>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}