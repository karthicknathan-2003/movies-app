import { useCallback, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "./context/AuthContext";
import { toast } from "sonner";
import { AuthDivider } from "@/utils/helper";

export default function RegisterCard() {
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        password: "",
    });

    const { register, login } = useAuth();
    const navigate = useNavigate();

    const isFormValid =
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.userName.trim() &&
        form.password.trim();

    const handleChange = useCallback((e) => {
        const { id, value } = e.target;
        setForm((prev) => ({ ...prev, [id]: value }));
    }, []);

    const handleRegister = useCallback(async () => {
        if (!isFormValid) {
            toast.error("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            await register(form);
            await login({
                userName: form.userName,
                password: form.password,
            });

            toast.success("Registration successful!");
            navigate("/");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [form, isFormValid, register, login, navigate]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            handleRegister();
        }
    }, [handleRegister]);

    /**
     * Redirect to the backend OAuth2 initiation URL.
     * Spring Security takes over — redirects to Google, then back to /login/callback.
     */
    const handleGoogleLogin = useCallback(() => {
        window.location.href = `${import.meta.env.VITE_BASE_URL}oauth2/authorization/google`;
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Create an account
                    </CardTitle>
                    <CardDescription>
                        Join CineVault and start tracking your favorites.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* First Name */}
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="John"
                            autoComplete="given-name"
                        />
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="Doe"
                            autoComplete="family-name"
                        />
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="userName">Username</Label>
                        <Input
                            id="userName"
                            value={form.userName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="Username"
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="********"
                            autoComplete="new-password"
                            showPasswordToggle
                        />
                    </div>

                    <Button
                        className="w-full"
                        disabled={loading || !isFormValid}
                        onClick={handleRegister}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Spinner size={18} color="white" />
                                Signing Up...
                            </span>
                        ) : (
                            "Sign Up"
                        )}
                    </Button>

                    {/* Divider */}
                    <AuthDivider text="or continue with" />

                    {/* Google Sign-up - backend-driven OAuth2 redirect */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {/* Google "G" logo */}
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground">
                        Already having an Account?{" "}
                        <NavLink
                            to="/login"
                            className="text-primary hover:underline"
                        >
                            Sign In
                        </NavLink>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}