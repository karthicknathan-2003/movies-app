import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaMoon, FaSun, FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
    const [dark, setDark] = useState(() => {
        const savedTheme = localStorage.getItem("theme");
        const isDark = savedTheme === "dark";
        // Keep the DOM class in sync during the first render so the page does not flash.
        document.documentElement.classList.toggle("dark", isDark);
        return isDark;
    });
    const [menuOpen, setMenuOpen] = useState(false);

    const { isAuthenticated } = useAuth();

    const toggleTheme = () => {
        const nextThemeIsDark = !dark;
        document.documentElement.classList.toggle("dark", nextThemeIsDark);
        localStorage.setItem("theme", nextThemeIsDark ? "dark" : "light");
        setDark(nextThemeIsDark);
    };

    const linkClass = ({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm font-medium transition
        ${isActive
            ? "bg-black/10 dark:bg-white/15 text-black dark:text-white"
            : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
        }`;

    return (
        <header className="sticky top-0 z-50 backdrop-blur border-b bg-white/80 dark:bg-black/80 border-black/10 dark:border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <NavLink to="/" className="text-xl font-bold text-black dark:text-white">
                    CineVault
                </NavLink>

                {/* Desktop Nav — Catalog and Browse */}
                <nav className="hidden md:flex items-center gap-2">
                    <NavLink to="/catalog" className={linkClass}>Catalog</NavLink>
                    <NavLink to="/search" className={linkClass}>Browse</NavLink>
                    {isAuthenticated && (
                        <NavLink to="/users" className={linkClass}>Users</NavLink>
                    )}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Profile / Auth Section */}
                    {isAuthenticated ? (
                        <NavLink
                            to="/profile"
                            className="px-3 py-1.5 rounded-md border border-black/20 dark:border-white/20 flex items-center gap-2 text-black dark:text-white"
                        >
                            <FaUserCircle />
                            <span className="hidden sm:inline">Profile</span>
                        </NavLink>
                    ) : (
                        <NavLink
                            to="/login"
                            className="px-3 py-1.5 rounded-md border border-black/20 dark:border-white/20 flex items-center gap-2 text-black dark:text-white"
                        >
                            <FaUserCircle />
                            <span className="hidden sm:inline">Login</span>
                        </NavLink>
                    )}

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="px-3 py-1.5 rounded-md border border-black/20 dark:border-white/20 flex items-center gap-2 text-black dark:text-white"
                    >
                        {dark ? <FaSun /> : <FaMoon />}
                        <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden text-black dark:text-white text-xl"
                    >
                        {menuOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden px-6 pb-6 pt-4 bg-white/95 dark:bg-black/95
                    border-t border-black/10 dark:border-white/10">

                    {/* Direct sub-links so users skip the Catalog hub page */}
                    <p className="text-[10px] uppercase font-semibold tracking-wider
                      text-black/30 dark:text-white/30 mb-2">
                        Browse
                    </p>
                    <div className="grid grid-cols-2 gap-1 mb-4">
                        {[
                            { to: "/movies", label: "Movies" },
                            { to: "/series", label: "Series" },
                            { to: "/anime", label: "Anime" },
                            { to: "/celebrities", label: "Celebrities" },
                            { to: "/franchises", label: "Franchises" },
                            ...(isAuthenticated ? [{ to: "/users", label: "Users" }] : []),
                        ].map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={linkClass}
                                onClick={() => setMenuOpen(false)}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Auth */}
                    {isAuthenticated ? (
                        <NavLink to="/profile" className={linkClass} onClick={() => setMenuOpen(false)}>
                            Profile
                        </NavLink>
                    ) : (
                        <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                            Login
                        </NavLink>
                    )}
                </div>
            )}
        </header>
    );
}