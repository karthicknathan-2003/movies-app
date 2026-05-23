import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { tmdb } from "@/api/tmdb";
import { BreadCrumbs, getPoster, SkeletonCard } from "@/utils/helper";
import { FaSearch, FaStar } from "react-icons/fa";
import Pagination from "@/components/Pagination";

const DEFAULT_SEARCH_TERMS = [
    "collection", "saga", "series", "trilogy", "universe"
];

// Only name-based sorting is available because TMDB's /search/collection
// endpoint does not return popularity or rating fields in its response.
const SORT_OPTIONS = [
    { value: "default", label: "Default" },
    { value: "name", label: "Name (A–Z)" },
    { value: "name_desc", label: "Name (Z–A)" },
];

export default function Franchises() {
    const navigate = useNavigate();
    const { id } = useParams();

    // Default browse state
    const [collections, setCollections] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [browseLoading, setBrowseLoading] = useState(true);

    // Search state
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchPage, setSearchPage] = useState(1);
    const [searchTotal, setSearchTotal] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);

    // Selected collection state - now loaded from URL parameter
    const [selected, setSelected] = useState(null);
    const [movies, setMovies] = useState([]);
    const [moviesLoading, setMoviesLoading] = useState(false);

    // Sort state — applied client-side on already-fetched results.
    // No extra API call is needed when the user changes sort order.
    const [sortBy, setSortBy] = useState("default");

    /* Default browse — fetches collections using broad search terms.
       Runs whenever the page number changes. Multiple terms are searched
       in parallel and their results are merged and deduplicated. */
    useEffect(() => {
        if (query.trim()) return;

        const loadCollections = async () => {
            setBrowseLoading(true);
            try {
                const responses = await Promise.allSettled(
                    DEFAULT_SEARCH_TERMS.map(term =>
                        tmdb.get("/collections/search", {
                            params: { query: term, page }
                        })
                    )
                );

                const merged = [];
                const ids = new Set();
                let maxPages = 1;

                responses.forEach(result => {
                    if (result.status !== "fulfilled") return;
                    const data = result.value.data;
                    if (data.total_pages > maxPages) {
                        maxPages = Math.min(data.total_pages, 20);
                    }

                    (data.results ?? []).forEach(item => {
                        if (!ids.has(item.id)) {
                            ids.add(item.id);
                            merged.push(item);
                        }
                    });
                });

                // Store the raw unsorted list in state — sorting is
                // applied at render time so changing sortBy is instant.
                setCollections(merged);
                setTotalPages(maxPages);
            } catch {
                setCollections([]);
            } finally {
                setBrowseLoading(false);
            }
        };

        loadCollections();
    }, [page, query]);

    /* Debounced user search — fires 500ms after the user stops typing. */
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSearchPage(1);
            return;
        }

        setSearchLoading(true);
        let stale = false;

        const timeout = setTimeout(async () => {
            try {
                const res = await tmdb.get("/collections/search", {
                    params: { query: trimmed, page: searchPage }
                });
                if (!stale) {
                    // Store raw results — sorting applied at render time.
                    setSearchResults(res.data.results ?? []);
                    setSearchTotal(Math.min(res.data.total_pages ?? 1, 20));
                }
            } catch {
                if (!stale) setSearchResults([]);
            } finally {
                if (!stale) setSearchLoading(false);
            }
        }, 500);

        return () => {
            stale = true;
            clearTimeout(timeout);
        };
    }, [query, searchPage]);

    /* Reset search page when query changes. */
    useEffect(() => {
        setSearchPage(1);
    }, [query]);

    /* Load franchise details when ID is present in URL */
    useEffect(() => {
        if (!id) {
            setSelected(null);
            setMovies([]);
            return;
        }

        const loadFranchiseDetails = async () => {
            setMoviesLoading(true);
            try {
                // First get the collection info
                const collectionRes = await tmdb.get(`/collection/${id}`);
                setSelected(collectionRes.data);

                // Sort movies chronologically
                const sorted = (collectionRes.data.parts ?? []).sort(
                    (a, b) => new Date(a.release_date) - new Date(b.release_date)
                );
                setMovies(sorted);
            } catch (error) {
                console.error("Failed to load franchise:", error);
                setSelected(null);
                setMovies([]);
            } finally {
                setMoviesLoading(false);
            }
        };

        loadFranchiseDetails();
    }, [id]);

    /* Sort a list of collections client-side by the selected sort option.
       Uses a shallow copy (spread) to avoid mutating the original state array.
       Since TMDB search results only contain id, name, poster_path,
       backdrop_path and overview — only name sorting is possible here. */
    const getSortedList = useCallback((list) => {
        if (!list || list.length === 0) return list;

        switch (sortBy) {
            case "name":
                // A → Z, locale-aware so accented characters sort correctly.
                return [...list].sort((a, b) =>
                    (a.name ?? "").localeCompare(b.name ?? "")
                );
            case "name_desc":
                // Z → A
                return [...list].sort((a, b) =>
                    (b.name ?? "").localeCompare(a.name ?? "")
                );
            default:
                // "default" — keep TMDB's original relevance order.
                return list;
        }
    }, [sortBy]);

    /* Navigate to franchise detail page */
    const handleSelectFranchise = useCallback((collection) => {
        navigate(`/franchises/${collection.id}`);
    }, [navigate]);

    const handleBack = () => {
        navigate("/franchises");
    };

    const handlePageChange = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSearchPageChange = (p) => {
        setSearchPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        // Reset both page counters so you don't land mid-list after resorting.
        setPage(1);
        setSearchPage(1);
    };

    // Apply sort at render time — no API call triggered.
    const sortedCollections = getSortedList(collections);
    const sortedSearchResults = getSortedList(searchResults);

    const isSearching = !!query.trim();
    const displayList = isSearching ? sortedSearchResults : sortedCollections;
    const isLoading = isSearching ? searchLoading : browseLoading;
    const activePage = isSearching ? searchPage : page;
    const activeTotal = isSearching ? searchTotal : totalPages;
    const onPageChange = isSearching ? handleSearchPageChange : handlePageChange;

    // Movie detail view
    if (id && selected) {
        return (
            window.scrollTo({ top: 0, behavior: "smooth" }),
            <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
                <div
                    className="relative h-72 bg-cover bg-center"
                    style={{
                        backgroundImage: selected.backdrop_path
                            ? `url(https://image.tmdb.org/t/p/original${selected.backdrop_path})`
                            : undefined,
                        backgroundColor: !selected.backdrop_path ? "#18181b" : undefined,
                    }}
                >
                    <div className="absolute inset-0 bg-black/60" />
                    <BreadCrumbs
                        paths={[
                            { name: "Home", to: "/" },
                            { name: "Catalog", to: "/catalog" },
                            { name: "Franchises", to: "/franchises" },
                            { name: selected.name },
                        ]}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-24 relative">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            {selected.poster_path && (
                                <img
                                    src={getPoster(selected.poster_path)}
                                    alt={selected.name}
                                    className="w-40 rounded-xl shadow object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold">{selected.name}</h1>
                                <p className="mt-2 text-sm text-black/50 dark:text-white/50">
                                    {movies.length} {movies.length === 1 ? "movie" : "movies"} in this franchise
                                </p>
                                {selected.overview && (
                                    <p className="mt-3 text-gray-700 dark:text-gray-300 max-w-3xl">
                                        {selected.overview}
                                    </p>
                                )}
                                <button
                                    onClick={handleBack}
                                    className="mt-4 px-4 py-2 rounded-lg border text-sm font-medium
                                               border-black/20 dark:border-white/20
                                               hover:bg-black/5 dark:hover:bg-white/5 transition"
                                >
                                    ← Back to Franchises
                                </button>
                            </div>
                        </div>

                        {moviesLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : movies.length === 0 ? (
                            <p className="text-center opacity-60 py-10">No movies found.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                                {movies.map((movie, index) => (
                                    <div
                                        key={movie.id}
                                        onClick={() => navigate(`/movies/${movie.id}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative">
                                            <span className="absolute top-2 left-2 z-10 text-[11px] px-2 py-1 rounded bg-black text-white font-bold">
                                                #{index + 1}
                                            </span>
                                            {movie.vote_average > 0 && (
                                                <span className="absolute top-2 right-2 z-10 text-[11px] px-2 py-1 rounded bg-black text-white flex items-center gap-1">
                                                    <FaStar size={10} className="text-yellow-400" />
                                                    {movie.vote_average.toFixed(1)}
                                                </span>
                                            )}
                                            <img
                                                src={
                                                    movie.poster_path
                                                        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                                                        : "https://placehold.co/300x450?text=No+Poster"
                                                }
                                                alt={movie.title}
                                                className="w-full h-[225px] object-cover rounded-xl
                                                           bg-gray-200 dark:bg-zinc-700
                                                           group-hover:scale-105 transition"
                                            />
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="text-sm font-medium line-clamp-2">
                                                {movie.title}
                                            </p>
                                            <p className="text-xs opacity-60">
                                                {movie.release_date?.slice(0, 4) || "TBA"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Franchise browser view
    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Catalog", to: "/catalog" },
                        { name: "Franchises" },
                    ]}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Movie Franchises</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Sort dropdown — sorts the already-loaded list instantly,
                            no API call fired when the user changes this. */}
                        <select
                            value={sortBy}
                            onChange={handleSortChange}
                            className="px-3 py-2 text-sm rounded border border-black/20 dark:border-white/20
                                       bg-white dark:bg-zinc-900 text-black dark:text-white
                                       focus:outline-none focus:ring-2
                                       focus:ring-black dark:focus:ring-white"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* Search bar */}
                        <div className="relative w-full sm:w-56">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search franchises..."
                                className="w-full pl-8 pr-3 py-2 text-sm rounded border
                                           border-black/20 dark:border-white/20
                                           bg-white dark:bg-zinc-900 text-black dark:text-white
                                           focus:outline-none focus:ring-2
                                           focus:ring-black dark:focus:ring-white"
                            />
                        </div>

                        <Pagination
                            page={activePage}
                            totalPages={activeTotal}
                            onPageChange={onPageChange}
                        />
                    </div>
                </div>

                {/* No results state */}
                {isSearching && !searchLoading && searchResults.length === 0 && (
                    <p className="text-center opacity-60 mt-10">
                        No franchises found for "{query}".
                    </p>
                )}

                {/* Collections grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                    {isLoading
                        ? Array.from({ length: 14 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))
                        : displayList.map((collection) => (
                            <div
                                key={collection.id}
                                onClick={() => handleSelectFranchise(collection)}
                                className="group cursor-pointer"
                            >
                                <img
                                    src={getPoster(collection.poster_path)}
                                    alt={collection.name}
                                    className="w-full h-[225px] object-cover rounded-xl
                                               bg-gray-200 dark:bg-zinc-700
                                               group-hover:scale-105 transition"
                                />
                                <p className="mt-2 text-sm font-medium text-center line-clamp-2">
                                    {collection.name}
                                </p>
                            </div>
                        ))
                    }
                </div>

                {/* Bottom pagination */}
                {!isLoading && displayList.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination
                            page={activePage}
                            totalPages={activeTotal}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}