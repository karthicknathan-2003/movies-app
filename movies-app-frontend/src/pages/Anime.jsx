import React, { useEffect, useState, useCallback } from "react";
import { tmdb } from "../api/tmdb";
import { BreadCrumbs, Card, SkeletonCard } from "@/utils/helper";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";

// Total number of pages available for exploration.
const TOTAL_PAGES = 20;
// Number of items per page — used to calculate the global ranking index.
const PAGE_SIZE = 20;
// TMDB genre ID for animation — used to filter anime from the TV top-rated feed.
const ANIMATION_GENRE_ID = 16;

export default function Anime() {
    const [anime, setAnime] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();

    // Memoized navigation handler — avoids recreating this function on every render.
    const goToAnime = useCallback(
        (id) => navigate(`/anime/${id}`),
        [navigate]
    );

    // Scroll to top when the page changes so the user sees fresh content from the start.
    const handlePageChange = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Fetch top-rated anime whenever the page number changes.
    // Uses the TV discover endpoint filtered to the Animation genre to surface anime titles.
    useEffect(() => {
        const fetchAnime = async () => {
            setLoading(true);
            setError(false);

            try {
                const res = await tmdb.get("/anime/top-rated", { params: { page } });
                // Fallback to empty array to prevent crashes if results field is missing.
                setAnime(res.data.results ?? []);
            } catch {
                // Surface a user-friendly error instead of silently failing.
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAnime();
    }, [page]); // Re-runs only when the user changes the page.

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto p-6">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Catalog", to: "/catalog" },
                        { name: "Anime" },
                    ]}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h1 className="text-3xl font-bold">Top Anime</h1>
                    {/* Pagination — top position for quick access before scrolling. */}
                    <Pagination
                        page={page}
                        totalPages={TOTAL_PAGES}
                        onPageChange={handlePageChange}
                    />
                </div>

                {/* Page-level error — shown if the fetch fails. */}
                {error && (
                    <p className="text-center text-red-500 mb-6">
                        Failed to load anime. Please refresh the page.
                    </p>
                )}

                {/* Anime Grid — shows skeletons while loading, cards once data is ready. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
                    {loading
                        ? Array.from({ length: 12 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))
                        : anime.map((item, index) => (
                            <div key={item.id} className="group hover:scale-101 transition">
                                <Card
                                    item={{ ...item, media_type: "tv" }} // Anime uses the TV detail endpoint.
                                    showType={false}
                                    showTitle={false}
                                    onClick={() => goToAnime(item.id)}
                                />

                                {/* Anime metadata shown below each card. */}
                                <div className="text-center mt-2">
                                    {/* Global rank across all pages e.g. page 2 starts at 21. */}
                                    <span className="font-bold">
                                        {(page - 1) * PAGE_SIZE + index + 1}
                                    </span>
                                    <p className="text-sm line-clamp-2">{item.name}</p>
                                    {/* Slice to show only the year portion of the date string. */}
                                    <p className="text-xs opacity-60">
                                        {item.first_air_date?.slice(0, 4)}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>

                {/* Pagination — bottom position for convenience after scrolling through the grid. */}
                {!loading && anime.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination
                            page={page}
                            totalPages={TOTAL_PAGES}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
