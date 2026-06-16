import { useState, useEffect, useCallback } from "react";
import { useAppSettings } from "@/components/context/AppSettingsContext";

const STORAGE_KEY = "cinevault_recently_viewed";
const MAX_ITEMS = 20; // keep last 20 titles

/**
 * Persists a browsing history list to localStorage.
 * Each item shape: { id, title, poster_path, media_type, visitedAt }
 *
 * Usage:
 *   const { recentlyViewed, addItem, clearAll } = useRecentlyViewed();
 */
export function useRecentlyViewed() {
    const { recentlyViewedEnabled } = useAppSettings();
    const [items, setItems] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever the list changes.
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // localStorage can be full or disabled — fail silently.
        }
    }, [items]);

    useEffect(() => {
        const syncFromStorage = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                setItems(raw ? JSON.parse(raw) : []);
            } catch {
                setItems([]);
            }
        };

        window.addEventListener("cinevault-recently-viewed-cleared", syncFromStorage);
        window.addEventListener("cinevault-recently-viewed-toggle", syncFromStorage);
        return () => {
            window.removeEventListener("cinevault-recently-viewed-cleared", syncFromStorage);
            window.removeEventListener("cinevault-recently-viewed-toggle", syncFromStorage);
        };
    }, []);

    /**
     * Adds a title to the front of the list.
     * If it already exists, moves it to the front instead of duplicating.
     * Trims the list to MAX_ITEMS after inserting.
     */
    const addItem = useCallback((item) => {
        if (!recentlyViewedEnabled) return;
        if (!item?.id || !item?.media_type) return;
        setItems((prev) => {
            const filtered = prev.filter(
                (existing) => !(existing.id === item.id && existing.media_type === item.media_type),
            );
            return [
                { ...item, visitedAt: Date.now() },
                ...filtered,
            ].slice(0, MAX_ITEMS);
        });
    }, [recentlyViewedEnabled]);

    const clearAll = useCallback(() => {
        setItems([]);
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent("cinevault-recently-viewed-cleared"));
    }, []);

    return { recentlyViewed: recentlyViewedEnabled ? items : [], addItem, clearAll };
}
