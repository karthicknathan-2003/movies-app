import React, { useEffect, useState, useCallback } from "react";
import { tmdb } from "../api/tmdb";
import { Card, SkeletonCard, BreadCrumbs } from "@/utils/helper";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { FaSearch } from "react-icons/fa";
import { useCatalogSearch } from "@/components/hooks/useCatalogSearch";
import { useRecentlyViewed } from "@/components/hooks/useRecentlyViewed";

const TOTAL_PAGES = 20;
const PAGE_SIZE = 20;

export default function Movies() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();
    const { query, setQuery, filtered } = useCatalogSearch(movies);
    const { addItem } = useRecentlyViewed();

    // Memoized navigation handler — avoids recreating this function on every render.
    const goTo = useCallback((item) => {
        // Track the visit before navigating.
        addItem({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            media_type: "movies",
        });
        return navigate(`/movies/${item.id}`);
    }, [navigate, addItem]);

    // Remove setQuery("") from handlePageChange.
    const handlePageChange = (p) => {
        setPage(p);
        // Don't clear query here — user may want to search the same term on page 2.
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Instead reset page when query changes.
    useEffect(() => {
        setPage(1);
    }, [query]);

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await tmdb.get("/movie/top-rated", { params: { page } });
                setMovies(res.data.results ?? []);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, [page]);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Catalog", to: "/catalog" },
                        { name: "Movies" },
                    ]}
                />

                {/* Header row — title, search, and pagination. */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold shrink-0">Top Movies</h1>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        {/* Search input — filters current page results locally. */}
                        <div className="relative w-full sm:w-56">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search on this page..."
                                className="w-full pl-8 pr-3 py-2 text-sm rounded border border-black/20 dark:border-white/20
                                           bg-white dark:bg-zinc-900 text-black dark:text-white
                                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                            />
                        </div>

                        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                    </div>
                </div>

                {error && (
                    <p className="text-center text-red-500 mb-6">
                        Failed to load movies. Please refresh the page.
                    </p>
                )}

                {/* No results state — shown when search returns nothing. */}
                {!loading && filtered.length === 0 && query.trim() && (
                    <p className="text-center opacity-60 mt-10">
                        No movies found for "{query}".
                    </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
                    {loading
                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                        : filtered.map((item, index) => (
                            <div key={item.id} className="group hover:scale-101 transition">
                                <Card
                                    item={{ ...item, media_type: "movie" }}
                                    showType={false}
                                    showTitle={false}
                                    onClick={() => goTo(item)}
                                />
                                <div className="text-center mt-2">
                                    <span className="font-bold">{(page - 1) * PAGE_SIZE + index + 1}</span>
                                    <p className="text-sm line-clamp-2">{item.title}</p>
                                    <p className="text-xs opacity-60">{item.release_date?.slice(0, 4)}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {!loading && movies.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                    </div>
                )}
            </div>
        </div>
    );
}