import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";

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

    /* Checks that all fields are filled before allowing submission.
       Prevents pointless API calls when the form is incomplete. */
    const isFormValid =
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.userName.trim() &&
        form.password.trim();

    /* Registers the user then immediately attempts an auto-login.
       Falls back to the login page with a warning if auto-login fails.
       AuthContext re-throws on failure so the outer catch can handle it. */
    const handleRegister = useCallback(async () => {
        if (!isFormValid) {
            toast.error("Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            await register(form);

            // Attempt auto-login so the user doesn't have to sign in again immediately.
            try {
                await login({ userName: form.userName, password: form.password });
                toast.success("Registration successful!");
                navigate("/");
            } catch (err) {
                // Auto-login is best-effort — account was created, so redirect to login.
                console.error("Auto-login failed after registration:", err);
                toast.warning("Account created, but auto-login failed. Please log in.");
                navigate("/login");
            }
        } catch (err) {
            // AuthContext already shows a toast — log for debugging without double-toasting.
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    }, [form, isFormValid, register, login, navigate]);

    /* Generic change handler — uses the input's id to update the matching form field.
       This avoids needing a separate onChange handler for each input. */
    const handleChange = useCallback((e) => {
        const { id, value } = e.target;
        setForm((prev) => ({ ...prev, [id]: value }));
    }, []);

    // Allow form submission via the Enter key for better accessibility.
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter") handleRegister();
    }, [handleRegister]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>
                        Join CineVault and track your favorites without hassle.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            placeholder="John"
                            value={form.firstName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            autoComplete="given-name"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            placeholder="Doe"
                            value={form.lastName}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            autoComplete="family-name"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="userName">Username</Label>
                        <Input
                            id="userName"
                            placeholder="Email or Username"
                            value={form.userName}
                            onChange={handleChange}
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
                            value={form.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            autoComplete="new-password"
                            showPasswordToggle={true}
                            disabled={loading}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleRegister}
                        // Disable while loading or if any field is empty to prevent dead submissions.
                        disabled={loading || !isFormValid}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2 justify-center">
                                <Spinner size={20} color="white" /> Signing Up...
                            </span>
                        ) : (
                            "Sign Up"
                        )}
                    </Button>

                    <p className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <NavLink to="/login" className="text-primary hover:underline">
                            Sign In
                        </NavLink>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}