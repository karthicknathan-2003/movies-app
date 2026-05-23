import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tmdb } from "@/api/tmdb";
import { BreadCrumbs, Card, SkeletonCard } from "@/utils/helper";
import Pagination from "@/components/Pagination";
import { FaFilm, FaTv, FaSlidersH, FaTimes } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* Static data — TMDB genre IDs rarely change
   so hardcoding avoids an extra API call. */
const MOVIE_GENRES = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
];

const TV_GENRES = [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" },
];

const SORT_OPTIONS = [
    { value: "popularity.desc", label: "Most Popular" },
    { value: "vote_average.desc", label: "Highest Rated" },
    { value: "vote_count.desc", label: "Most Votes" },
    { value: "primary_release_date.desc", label: "Newest" },
    { value: "revenue.desc", label: "Box Office" },
];

// Generate year options from 1950 to current year descending
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
    { length: CURRENT_YEAR - 1949 },
    (_, i) => CURRENT_YEAR - i
);

const RATING_OPTIONS = [
    { value: "all", label: "Any Rating" },
    { value: "9", label: "9+ Masterpiece" },
    { value: "8", label: "8+ Excellent" },
    { value: "7", label: "7+ Good" },
    { value: "6", label: "6+ Decent" },
];


// FilterChip — clickable pill for genre selection
function FilterChip({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border
                        transition-all duration-150 cursor-pointer whitespace-nowrap
                ${active
                    ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                    : "border-black/15 dark:border-white/15 text-black/60 dark:text-white/60 hover:border-black/30 dark:hover:border-white/30"
                }`}
        >
            {label}
        </button>
    );
}

export default function Discover() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Read initial filter state from URL params so links are shareable.
    const [mediaType, setMediaType] = useState(searchParams.get("type") || "movie");
    const [genreId, setGenreId] = useState(searchParams.get("genre") ? Number(searchParams.get("genre")) : null);
    const [year, setYear] = useState(searchParams.get("year") ? Number(searchParams.get("year")) : "");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "popularity.desc");
    const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
    const [page, setPage] = useState(1);

    // UI state
    const [results, setResults] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const genres = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;

    /* Sync filters to URL whenever they change — makes results shareable/bookmarkable */
    useEffect(() => {
        const params = new URLSearchParams();
        params.set("type", mediaType);
        if (genreId) params.set("genre", genreId);
        if (year) params.set("year", year);
        if (sortBy !== "popularity.desc") params.set("sort", sortBy);
        if (minRating) params.set("rating", minRating);
        setSearchParams(params, { replace: true });
    }, [mediaType, genreId, year, sortBy, minRating, setSearchParams]);

    /* Fetch results whenever any filter or page changes */
    useEffect(() => {
        let stale = false;
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await tmdb.get("/discover", {
                    params: {
                        mediaType: mediaType,
                        genreId: genreId || undefined,
                        year: year || undefined,
                        sortBy,
                        minRating: minRating || undefined,
                        page,
                    },
                });
                if (!stale) {
                    setResults(res.data.results ?? []);
                    // Cap at 500 pages — TMDB's API limit
                    setTotalPages(Math.min(res.data.total_pages ?? 1, 500));
                }
            } catch {
                if (!stale) setResults([]);
            } finally {
                if (!stale) setLoading(false);
            }
        };
        fetch();
        return () => { stale = true; };
    }, [mediaType, genreId, year, sortBy, minRating, page]);

    /* Reset to page 1 whenever any filter changes */
    useEffect(() => { setPage(1); }, [mediaType, genreId, year, sortBy, minRating]);

    /* Navigation — route to correct detail page */
    const handleSelect = useCallback((item) => {
        if (mediaType === "movie") return navigate(`/movies/${item.id}`);
        const isAnime =
            item.genre_ids?.includes(16) &&
            (item.origin_country?.includes("JP") ?? false);
        navigate(isAnime ? `/anime/${item.id}` : `/series/${item.id}`);
    }, [mediaType, navigate]);

    /* Clear all filters */
    const resetFilters = () => {
        setGenreId(null);
        setYear("");
        setSortBy("popularity.desc");
        setMinRating("");
    };

    const activeFilterCount = [
        genreId, year, sortBy !== "popularity.desc", minRating
    ].filter(Boolean).length;

    const activeGenre = genres.find(g => g.id === genreId);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Catalog", to: "/catalog" },
                        { name: "Discover" },
                    ]}
                />

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center
                                justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Discover</h1>
                        {activeGenre && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Browsing <span className="font-semibold text-black dark:text-white">
                                    {activeGenre.name}
                                </span>
                                {year ? ` · ${year}` : ""}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Media type toggle */}
                        <div className="flex items-center rounded-xl border border-black/15 dark:border-white/15 overflow-hidden">
                            {[
                                { value: "movie", label: "Movies", icon: <FaFilm size={11} /> },
                                { value: "tv", label: "Series", icon: <FaTv size={11} /> },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setMediaType(opt.value); setGenreId(null); }}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold
                                                transition-colors
                                        ${mediaType === opt.value
                                            ? "bg-black dark:bg-white text-white dark:text-black"
                                            : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                                        }`}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter button — mobile */}
                        <button
                            onClick={() => setFiltersOpen(v => !v)}
                            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl
                                        text-xs font-semibold border transition-colors
                                ${activeFilterCount > 0
                                    ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                                    : "border-black/15 dark:border-white/15 text-black/60 dark:text-white/60"
                                }`}
                        >
                            <FaSlidersH size={11} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-white dark:bg-black
                                                 text-black dark:text-white text-[9px] font-bold
                                                 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Reset filters */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1 text-xs font-medium
                                           text-red-500 hover:text-red-600 transition-colors"
                            >
                                <FaTimes size={10} />
                                Reset
                            </button>
                        )}

                        <Pagination page={page} totalPages={Math.min(totalPages, 50)} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                    </div>
                </div>

                {/* Filter panel — always visible on desktop, toggle on mobile */}
                <div className={`${filtersOpen ? "block" : "hidden"} sm:block`}>
                    {/* Sort + Year + Rating row */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger
                                className="w-[140px] h-9 text-xs font-semibold rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-black dark:text-white"
                            >
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Year */}
                        <Select
                            value={year ? String(year) : "all"}
                            onValueChange={(val) => setYear(val === "all" ? "" : Number(val))}
                        >
                            <SelectTrigger
                                className="w-[130px] h-9 text-xs font-semibold rounded-xl
               border border-black/15 dark:border-white/15
               bg-white dark:bg-zinc-900 text-black dark:text-white"
                            >
                                <SelectValue placeholder="Any Year" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">Any Year</SelectItem>

                                {YEARS.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Min Rating */}
                        <Select
                            value={minRating || "all"}
                            onValueChange={(val) => setMinRating(val === "all" ? "" : val)}
                        >
                            <SelectTrigger
                                className="w-[140px] h-9 text-xs font-semibold rounded-xl border border-black/15 dark:border-white/15 bg-white dark:bg-zinc-900 text-black dark:text-white"
                            >
                                <SelectValue placeholder="Rating" />
                            </SelectTrigger>
                            <SelectContent>
                                {RATING_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                    </div>

                    {/* Genre chips — horizontally scrollable on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0
                                    sm:flex-wrap adaptive-scrollbar mb-6">
                        {/* "All" chip */}
                        <FilterChip
                            label="All"
                            active={genreId === null}
                            onClick={() => setGenreId(null)}
                        />
                        {genres.map(g => (
                            <FilterChip
                                key={g.id}
                                label={g.name}
                                active={genreId === g.id}
                                onClick={() => setGenreId(genreId === g.id ? null : g.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Results grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
                    {loading
                        ? Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)
                        : results.length === 0
                            ? (
                                <div className="col-span-full flex flex-col items-center
                                                justify-center py-20 text-center">
                                    <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800
                                                    flex items-center justify-center mb-3">
                                        <FaSlidersH className="text-zinc-400" size={20} />
                                    </div>
                                    <p className="text-sm font-semibold text-black dark:text-white mb-1">
                                        No results found
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Try adjusting your filters
                                    </p>
                                    <button
                                        onClick={resetFilters}
                                        className="mt-4 px-4 py-2 rounded-lg bg-black dark:bg-white
                                                   text-white dark:text-black text-xs font-semibold
                                                   hover:opacity-80 transition"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )
                            : results.map((item) => (
                                <div key={item.id} className="group">
                                    <Card
                                        item={{
                                            ...item,
                                            // Inject media_type so the Card badge renders correctly.
                                            // TMDB's /discover doesn't always include it.
                                            media_type: mediaType,
                                        }}
                                        showType={true}
                                        showTitle={true}
                                        onClick={() => handleSelect(item)}
                                    />
                                    <div className="text-center">
                                        {/* <p className="text-xs font-medium line-clamp-2 leading-snug">
                                            {item.title || item.name}
                                        </p> */}
                                        <p className="text-[11px] opacity-50 mt-0.5">
                                            {(item.release_date || item.first_air_date)?.slice(0, 4)}
                                        </p>
                                    </div>
                                </div>
                            ))
                    }
                </div>

                {/* Bottom pagination */}
                {!loading && results.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination
                            page={page}
                            totalPages={Math.min(totalPages, 50)}
                            onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
