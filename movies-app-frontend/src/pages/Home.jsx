import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tmdb } from "../api/tmdb";
import { Grid } from "@/utils/helper";
import { FaFire, FaSearch } from "react-icons/fa";
import { GiSwordsPower } from "react-icons/gi";

export default function Home() {
    const navigate = useNavigate();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [trending, setTrending] = useState([]);
    const [popularAnime, setPopularAnime] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState(false);

    const isAnime = (item) =>
        item.media_type === "tv" &&
        (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) &&
        (item.origin_country?.includes("JP") ?? true);

    const goTo = useCallback((item) => {
        if (item.media_type === "movie") return navigate(`/movies/${item.id}`);
        if (isAnime(item)) return navigate(`/anime/${item.id}`);
        navigate(`/series/${item.id}`);
    }, [navigate]);

    /* Search — single effect handles debounce + fetch*/
    useEffect(() => {
        const trimmed = query.trim();

        if (!trimmed) {
            setResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);

        //  Each effect run gets its own stale flag.
        //  Flipped to true by cleanup when query changes — discards results silently.
        let stale = false;

        const timeout = setTimeout(async () => {
            try {
                const res = await tmdb.get("/search", { params: { query: trimmed } });
                if (!stale) setResults(res.data.results ?? []);
            } catch {
                if (!stale) setResults([]);
            } finally {
                if (!stale) setSearchLoading(false);
            }
        }, [600]);

        return () => {
            stale = true;
            clearTimeout(timeout);
        };
    }, [query]);

    /*  Initial Page Load  */
    useEffect(() => {
        const load = async () => {
            setPageLoading(true);
            setPageError(false);
            try {
                const [popularRes, animeRes] = await Promise.all([
                    tmdb.get("/trending"),
                    tmdb.get("/anime/popular"),
                ]);
                setTrending(popularRes.data.results ?? []);
                setPopularAnime(animeRes.data.results ?? []);
            } catch {
                setPageError(true);
            } finally {
                setPageLoading(false);
            }
        };
        load();
    }, []);

    const showSearchResults = query.trim().length > 0;

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <div className="max-w-6xl mx-auto p-6">
                {/* Search Input */}
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full pl-10 p-3 rounded border border-black/20 dark:border-white/20
                                   bg-white dark:bg-zinc-900 text-black dark:text-white
                                   focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        placeholder="Search movies, TV series, or anime..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {pageError && (
                    <p className="mt-8 text-center text-red-500">
                        Failed to load content. Please refresh the page.
                    </p>
                )}

                {showSearchResults ? (
                    <>
                        {!searchLoading && results.length === 0 && (
                            <p className="mt-8 text-center text-black dark:text-white">
                                No results found for "{query}"
                            </p>
                        )}
                        <Grid
                            title={`Results for "${query}"`}
                            icon={<FaSearch />}
                            iconColor="text-gray-500"
                            items={results}
                            onSelect={goTo}
                            loading={searchLoading}
                            showType
                        />
                    </>
                ) : (
                    <>
                        <Grid
                            title="Trending This Week"
                            icon={<FaFire />}
                            iconColor="text-orange-500"
                            items={trending}
                            onSelect={goTo}
                            loading={pageLoading}
                            showType
                        />
                        <Grid
                            title="Popular Anime"
                            icon={<GiSwordsPower />}
                            iconColor="text-pink-500"
                            items={popularAnime}
                            onSelect={(item) => navigate(`/anime/${item.id}`)}
                            loading={pageLoading}
                        />
                    </>
                )}
            </div>
        </div>
    );
}