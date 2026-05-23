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

export default function LoginCard() {
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [credentials, setCredentials] = useState({
        userName: "",
        password: "",
    });

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const isFormValid =
        credentials.userName.trim() &&
        credentials.password.trim();

    const handleChange = useCallback((e) => {
        const { id, value } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [id]: value,
        }));
    }, []);

    const handleLogin = useCallback(async () => {
        if (!isFormValid) {
            toast.error("Please enter username and password.");
            return;
        }

        setLoading(true);

        try {
            await login(credentials);
            toast.success("Welcome back!");
            navigate("/");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [credentials, isFormValid, login, navigate]);

    const handleGoogleSuccess = useCallback(
        async (response) => {
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
        },
        [loginWithGoogle, navigate]
    );

    const handleGoogleError = useCallback(() => {
        toast.error("Google sign-in failed.");
    }, []);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter") {
                handleLogin();
            }
        },
        [handleLogin]
    );

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        Welcome back
                    </CardTitle>
                    <CardDescription>
                        Sign in to continue to CineVault.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="userName">Username</Label>
                        <Input
                            id="userName"
                            value={credentials.userName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="Enter username"
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={credentials.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            showPasswordToggle
                        />
                    </div>

                    <Button
                        className="w-full"
                        disabled={loading || !isFormValid}
                        onClick={handleLogin}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Spinner size={18} color="white" />
                                Signing In...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                    {/* Divider */}
                    <AuthDivider text="or continue with Google" />
                    {/* Google Login */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            text="signin_with" 
                            shape="rectangular"
                            size="large"
                            width="320"
                            disabled={googleLoading}
                        />
                    </div>
                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <NavLink
                            to="/signup"
                            className="text-primary hover:underline"
                        >
                            Sign Up
                        </NavLink>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}