import { NavLink } from "react-router-dom";
import { Box, Home, Search, User, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BottomNav = () => {
    const { isAuthenticated } = useAuth();

    const navItems = [
        { to: "/", icon: Home, label: "Home" },
        { to: "/search", icon: Search, label: "Search" },
        { to: "/catalog", icon: Box, label: "Catalog" },
        ...(isAuthenticated ? [
            { to: "/users", icon: Users, label: "Users" },
            { to: "/profile", icon: User, label: "Profile" }
        ] : []),
    ];

    const linkClass = ({ isActive }) =>
        `flex flex-col items-center justify-center py-2 px-3 text-xs font-medium transition-colors ${isActive
            ? "text-black dark:text-white"
            : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
        }`;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex justify-around">
            {navItems.map((item) => {
                const NavIcon = item.icon;

                return (
                    <NavLink key={item.to} to={item.to} className={linkClass}>
                        <NavIcon className="w-5 h-5 mb-1" />
                        {item.label}
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default BottomNav;
