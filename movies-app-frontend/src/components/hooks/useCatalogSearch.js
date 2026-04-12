import { useState, useMemo } from "react";

/**
 * Filters a list of catalog items by a search query against name/title fields.
 *
 * @param {Array} items - The full list of items to search through.
 * @returns {{ query, setQuery, filtered }} - Query state and the filtered results.
 */
export function useCatalogSearch(items) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => {
            const label = (item.title || item.name || "").toLowerCase();
            return label.includes(q);
        });
    }, [query, items]);

    return { query, setQuery, filtered };
}