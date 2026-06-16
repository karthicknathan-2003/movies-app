import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaCog } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getCurrentUserProfile } from "@/api/userService";
import Notifications from "@/components/Notifications";

export function Navbar() {
    const [avatarUrl, setAvatarUrl] = useState("");
    const { isAuthenticated, user, fullName } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let ignore = false;

        const loadProfile = async () => {
            try {
                const res = await getCurrentUserProfile();
                if (!ignore) {
                    setAvatarUrl(res.data?.avatarUrl ?? "");
                }
            } catch {
                if (!ignore) {
                    setAvatarUrl("");
                }
            }
        };

        loadProfile();

        return () => {
            ignore = true;
        };
    }, [isAuthenticated]);

    const profileInitials = useMemo(() => {
        const source = (fullName || user || "U").trim();
        const parts = source.split(/\s+/).filter(Boolean);

        return parts
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("") || "U";
    }, [fullName, user]);

    const linkClass = ({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm font-medium transition
        ${isActive
            ? "bg-black/10 dark:bg-white/15 text-black dark:text-white"
            : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
        }`;

    const iconButtonClass = ({ isActive }) =>
        `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition
        ${isActive
            ? "border-transparent bg-black text-white dark:bg-white dark:text-black"
            : "border-black/20 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
        }`;

    return (
        <header className="sticky top-0 z-50 backdrop-blur border-b bg-white/80 dark:bg-black/80 border-black/10 dark:border-white/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
                <NavLink to="/" className="shrink-0 text-lg sm:text-xl font-bold text-black dark:text-white">
                    CineVault
                </NavLink>

                <nav className="hidden md:flex items-center gap-2">
                    <NavLink to="/catalog" className={linkClass}>Catalog</NavLink>
                    <NavLink to="/search" className={linkClass}>Browse</NavLink>
                    {isAuthenticated && (
                        <NavLink to="/users" className={linkClass}>Users</NavLink>
                    )}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    {isAuthenticated && <Notifications />}

                    <NavLink
                        to="/settings"
                        className={iconButtonClass}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <FaCog size={16} />
                    </NavLink>

                    {isAuthenticated ? (
                        <NavLink
                            to="/profile"
                            className={iconButtonClass}
                            aria-label="Profile"
                            title={fullName || user || "Profile"}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={fullName || user || "Profile"}
                                    className="h-8 w-8 rounded-full object-cover border border-black/10 dark:border-white/10"
                                />
                            ) : (
                                <span
                                    className="flex h-8 w-8 items-center justify-center rounded-full
                                        bg-black text-xs font-semibold text-white dark:bg-white dark:text-black"
                                >
                                    {profileInitials}
                                </span>
                            )}
                        </NavLink>
                    ) : (
                        <NavLink
                            to="/login"
                            className={iconButtonClass}
                            aria-label="Login"
                            title="Login"
                        >
                            <span
                                className="flex h-8 w-8 items-center justify-center rounded-full
                                    bg-black text-xs font-semibold text-white dark:bg-white dark:text-black"
                            >
                                U
                            </span>
                        </NavLink>
                    )}
                </div>
            </div>
        </header>
    );
}