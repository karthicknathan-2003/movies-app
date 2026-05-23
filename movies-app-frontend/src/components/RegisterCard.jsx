import { useCallback, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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
    const [googleLoading, setGoogleLoading] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        password: "",
    });

    const { register, login, loginWithGoogle } = useAuth();
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

    const handleGoogleSuccess = useCallback(async (response) => {
        setGoogleLoading(true);

        try {
            await loginWithGoogle(response.credential);
            toast.success("Signed in successfully!");
            navigate("/");
        } catch (error) {
            console.error(error);
        } finally {
            setGoogleLoading(false);
        }
    }, [loginWithGoogle, navigate]);

    const handleGoogleError = useCallback(() => {
        toast.error("Google sign-up failed.");
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") {
            handleRegister();
        }
    }, [handleRegister]);

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
                            placeholder="••••••••"
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
                    <AuthDivider text="or continue with Google" />
                    {/* Google Login */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signup_with"
                            shape="rectangular"
                            size="large"
                            width="320"
                            disabled={googleLoading}
                        />
                    </div>
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