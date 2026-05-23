import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaFilm, FaSearch, FaTv, FaUser } from "react-icons/fa";
import { tmdb } from "@/api/tmdb";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPoster } from "@/utils/helper";

const getSearchTitle = (item) => item.title || item.name || item.original_title || item.original_name || "Untitled";
const getSearchType = (item) => {
    if (item.media_type === "person") return "Celebrity";
    if (item.media_type === "anime" || item.type === "anime") return "Anime";
    if (item.media_type === "movie") return "Movie";
    if (item.media_type === "tv") return isAnime(item) ? "Anime" : "Series";
    return item.media_type?.toUpperCase() || "Item";
};

const isAnime = (item) =>
    item.media_type === "anime" ||
    (item.media_type === "tv" && (
        item.genre_ids?.includes(16) ||
        item.genres?.some((genre) => genre.id === 16) ||
        item.origin_country?.includes("JP")
    ));

const getResultImage = (item) => {
    const path = item.poster_path || item.backdrop_path || item.profile_path;
    return getPoster(path);
};

const getTypeIcon = (item) => {
    if (item.media_type === "person") return FaUser;
    if (item.media_type === "anime" || isAnime(item)) return FaTv;
    if (item.media_type === "movie") return FaFilm;
    return FaTv;
};

// Skeleton card for loading state.
const SearchResultSkeleton = () => {
    return (
        <Card className="overflow-hidden">
            <div className="flex gap-4 p-4">
                <Skeleton className="h-24 w-16 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-12 mb-2" />
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        </Card>
    );
}

/* Suggestions is a separate component to fetch and display trending/popular items when the search term is empty. 
It can be used in the Search component to show suggestions below the search input. */
export function Suggestions() {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    // Fetch suggestions on mount.
    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const [trending, anime] = await Promise.allSettled([
                    tmdb.get("/trending"),
                    tmdb.get("/anime/popular"),
                ]);

                const suggestionItems = [];
                if (trending.status === "fulfilled") {
                    suggestionItems.push(...(trending.value.data.results ?? []).slice(0, 8));
                }
                if (anime.status === "fulfilled") {
                    const animeItems = anime.value.data.results ?? [];
                    suggestionItems.push(
                        ...animeItems.slice(0, 4).map((item) => ({ ...item, media_type: "anime" }))
                    );
                }

                const uniqueSuggestions = Array.from(
                    new Map(
                        suggestionItems.map((item) => [`${item.media_type}:${item.id}`, item])
                    ).values()
                ).slice(0, 12); // Limit to 12 items

                setSuggestions(uniqueSuggestions);
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, []);

    const goTo = useCallback((item) => {
        if (item.media_type === "person") return navigate(`/celebrities/${item.id}`);
        if (item.media_type === "movie") return navigate(`/movies/${item.id}`);
        if (item.media_type === "anime" || isAnime(item)) return navigate(`/anime/${item.id}`);
        if (item.media_type === "tv") return navigate(`/series/${item.id}`);
        return null;
    }, [navigate]);

    return (
        <div>
            <h2 className="text-lg sm:text-xl font-semibold mt-6 mb-4 md:mb-6">
                You might be interested in
            </h2>

            {loadingSuggestions ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SearchResultSkeleton key={i} />
                    ))}
                </div>
            ) : suggestions.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {suggestions.map((item) => {
                        const title = getSearchTitle(item);
                        const type = getSearchType(item);
                        const Icon = getTypeIcon(item);
                        const overview = item.overview || item.known_for_department || item.character || "No details available.";
                        return (
                            <Card
                                key={`${item.media_type}:${item.id}`}
                                className="cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-lg/50"
                                onClick={() => goTo(item)}
                            >
                                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 h-full">
                                    <img
                                        src={getResultImage(item)}
                                        alt={title}
                                        className="h-20 sm:h-24 w-14 sm:w-16 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                "https://placehold.co/160x240?text=No+Image";
                                        }}
                                    />
                                    <div className="min-w-0 flex-1 flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 flex-wrap">
                                            <Icon className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{type}</span>
                                        </div>
                                        <h2 className="text-xs sm:text-sm font-semibold text-black dark:text-white truncate">
                                            {title}
                                        </h2>
                                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-4 sm:leading-5 text-zinc-600 dark:text-zinc-400 line-clamp-2 sm:line-clamp-3 flex-1">
                                            {overview}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : null}
        </div>
    )
}

export default function Search() {
    const navigate = useNavigate();
    const [term, setTerm] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const trimmed = term.trim();
        if (!trimmed) {
            setResults([]);
            setLoading(false);
            return;
        }

        let stale = false;
        setLoading(true);

        // Debounce: wait 500ms before fetching.
        const timeout = setTimeout(async () => {
            try {
                const [multi, anime] = await Promise.allSettled([
                    tmdb.get("/search", { params: { query: trimmed } }),
                    tmdb.get("/anime/search", { params: { query: trimmed } }),
                ]);

                const searchResults = [];
                if (multi.status === "fulfilled") {
                    searchResults.push(...(multi.value.data.results ?? []));
                }
                if (anime.status === "fulfilled") {
                    const animeHits = anime.value.data.results ?? [];
                    searchResults.push(
                        ...animeHits.map((item) => ({ ...item, media_type: "anime" }))
                    );
                }

                const unique = Array.from(
                    new Map(
                        searchResults.map((item) => [`${item.media_type}:${item.id}`, item])
                    ).values()
                );

                if (!stale) {
                    setResults(unique);
                }
            } catch {
                if (!stale) setResults([]);
            } finally {
                if (!stale) setLoading(false);
            }
        }, 500);

        return () => {
            stale = true;
            clearTimeout(timeout);
        };
    }, [term]);

    const goTo = useCallback((item) => {
        if (item.media_type === "person") return navigate(`/celebrities/${item.id}`);
        if (item.media_type === "movie") return navigate(`/movies/${item.id}`);
        if (item.media_type === "anime" || isAnime(item)) return navigate(`/anime/${item.id}`);
        if (item.media_type === "tv") return navigate(`/series/${item.id}`);
        return null;
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-20 md:pb-0">
            <div className="max-w-6xl mx-auto p-4 sm:p-6">
                {/* Search Input */}
                <div className="mb-6 md:mb-8">
                    <label className="sr-only" htmlFor="global-search">
                        Search
                    </label>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <Input
                            id="global-search"
                            placeholder="Search movies, series, anime, celebrities..."
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            autoFocus
                            className="pl-10 text-base"
                        />
                        <button
                            onClick={() => setTerm("")}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-opacity cursor-pointer ${term ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                            &#10005;
                        </button>
                    </div>
                </div>

                {term.trim() ? (
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold mb-4 md:mb-6">
                            Search results for "{term}"
                        </h1>

                        {loading ? (
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <SearchResultSkeleton key={i} />
                                ))}
                            </div>
                        ) : results.length === 0 ? (
                            <div>
                                <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 p-8 text-center mb-8">
                                    <p className="text-base text-zinc-600 dark:text-zinc-300">
                                        No results found for "{term}".
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                        Try a different search term.
                                    </p>
                                </div>
                                <Suggestions />
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {results.map((item) => {
                                    const title = getSearchTitle(item);
                                    const type = getSearchType(item);
                                    const Icon = getTypeIcon(item);
                                    const overview = item.overview || item.known_for_department || item.character || "No details available.";

                                    return (
                                        <Card
                                            key={`${item.media_type}:${item.id}`}
                                            className="cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-lg/50"
                                            onClick={() => goTo(item)}
                                        >
                                            <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 h-full">
                                                <img
                                                    src={getResultImage(item)}
                                                    alt={title}
                                                    className="h-20 sm:h-24 w-14 sm:w-16 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "https://placehold.co/160x240?text=No+Image";
                                                    }}
                                                />
                                                <div className="min-w-0 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 flex-wrap">
                                                        <Icon className="h-3 w-3 flex-shrink-0" />
                                                        <span className="truncate">{type}</span>
                                                    </div>
                                                    <h2 className="text-xs sm:text-sm font-semibold text-black dark:text-white truncate">
                                                        {title}
                                                    </h2>
                                                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-4 sm:leading-5 text-zinc-600 dark:text-zinc-400 line-clamp-2 sm:line-clamp-3 flex-1">
                                                        {overview}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 p-8 text-center">
                            <FaSearch className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                            <p className="text-base text-zinc-600 dark:text-zinc-300">
                                Search across movies, series, anime, and celebrities.
                            </p>
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                Start typing to see results.
                            </p>
                        </div>
                        <Suggestions />
                    </>
                )}
            </div>
        </div>
    );
}
