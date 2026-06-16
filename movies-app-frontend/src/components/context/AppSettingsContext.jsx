import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_KEY = "theme";
const VIEW_MODE_KEY = "cinevault_default_view_mode";
const RECENTLY_VIEWED_ENABLED_KEY = "cinevault_recently_viewed_enabled";
const RECENTLY_VIEWED_STORAGE_KEY = "cinevault_recently_viewed";

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        return savedTheme === "dark" ? "dark" : "light";
    });
    const [defaultViewMode, setDefaultViewMode] = useState(() => {
        const savedViewMode = localStorage.getItem(VIEW_MODE_KEY);
        return savedViewMode === "infinite" ? "infinite" : "pagination";
    });
    const [recentlyViewedEnabled, setRecentlyViewedEnabled] = useState(() => {
        const savedValue = localStorage.getItem(RECENTLY_VIEWED_ENABLED_KEY);
        return savedValue !== "false";
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        // Keep native browser chrome like scrollbars and form controls aligned with the app theme.
        let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
        if (!colorSchemeMeta) {
            colorSchemeMeta = document.createElement("meta");
            colorSchemeMeta.setAttribute("name", "color-scheme");
            document.head.appendChild(colorSchemeMeta);
        }
        colorSchemeMeta.setAttribute("content", theme === "dark" ? "dark" : "light");
        document.documentElement.style.colorScheme = theme;

        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem(VIEW_MODE_KEY, defaultViewMode);
    }, [defaultViewMode]);

    useEffect(() => {
        localStorage.setItem(RECENTLY_VIEWED_ENABLED_KEY, String(recentlyViewedEnabled));
        if (!recentlyViewedEnabled) {
            localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
        }
        window.dispatchEvent(new CustomEvent("cinevault-recently-viewed-toggle"));
    }, [recentlyViewedEnabled]);

    const clearRecentlyViewed = () => {
        localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent("cinevault-recently-viewed-cleared"));
    };

    const value = useMemo(() => ({
        theme,
        setTheme,
        defaultViewMode,
        setDefaultViewMode,
        recentlyViewedEnabled,
        setRecentlyViewedEnabled,
        clearRecentlyViewed,
    }), [theme, defaultViewMode, recentlyViewedEnabled]);

    return (
        <AppSettingsContext.Provider value={value}>
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    const context = useContext(AppSettingsContext);
    if (!context) {
        throw new Error("useAppSettings must be used within an AppSettingsProvider.");
    }
    return context;
}
