import React, { useEffect, useState, useCallback } from "react";
import { tmdb } from "../api/tmdb";
import { Card, SkeletonCard, BreadCrumbs } from "@/utils/helper";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { FaSpinner } from "react-icons/fa";
import { useRecentlyViewed } from "@/components/hooks/useRecentlyViewed";
import { useInfiniteScrollTrigger } from "@/components/hooks/useInfiniteScrollTrigger";
import { useAppSettings } from "@/components/context/AppSettingsContext";
import { useWatchlistIds } from "@/components/hooks/useWatchlistIds";

const TOTAL_PAGES = 20;

const mergeById = (current, incoming) => {
    const map = new Map(current.map((item) => [item.id, item]));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
};

export default function Series() {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();
    const { addItem } = useRecentlyViewed();
    const { defaultViewMode: viewMode } = useAppSettings();
    const watchlistIds = useWatchlistIds();

    const goTo = useCallback((item) => {
        addItem({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            media_type: "series",
        });
        return navigate(`/series/${item.id}`);
    }, [navigate, addItem]);

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
        if (viewMode === "pagination") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    useEffect(() => {
        setSeries([]);
        setPage(1);
    }, [viewMode]);

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await tmdb.get("/tv/top-rated", { params: { page } });
                const nextResults = res.data.results ?? [];
                setSeries((current) =>
                    viewMode === "infinite" && page > 1 ? mergeById(current, nextResults) : nextResults,
                );
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSeries();
    }, [page, viewMode]);

    const infiniteSentinelRef = useInfiniteScrollTrigger({
        enabled: viewMode === "infinite",
        loading,
        hasMore: page < TOTAL_PAGES,
        onLoadMore: () => setPage((current) => current + 1),
    });

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <BreadCrumbs
                    overlay={false}
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Catalog", to: "/catalog" },
                        { name: "Series" },
                    ]}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Top TV Shows</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {viewMode === "pagination" && (
                            <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                        )}
                    </div>
                </div>

                {error && (
                    <p className="text-center text-red-500 mb-6">
                        Failed to load series. Please refresh the page.
                    </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
                    {loading && series.length === 0
                        ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                        : series.map((item, index) => (
                            <div key={item.id} className="group hover:scale-101 transition">
                                <Card
                                    item={{ ...item, media_type: "tv" }}
                                    showType={false}
                                    showTitle={false}
                                    watchlistIds={watchlistIds}
                                    onClick={() => goTo(item)}
                                />
                                <div className="text-center mt-2">
                                    <span className="font-bold">
                                        {viewMode === "infinite" ? index + 1 : ((page - 1) * 20) + index + 1}
                                    </span>
                                    <p className="text-sm line-clamp-2">{item.name}</p>
                                    <p className="text-xs opacity-60">{item.first_air_date?.slice(0, 4)}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {viewMode === "pagination" && !loading && series.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                    </div>
                )}

                {viewMode === "infinite" && page < TOTAL_PAGES && (
                    <div ref={infiniteSentinelRef} className="flex justify-center py-8">
                        {loading && series.length > 0 ? (
                            <FaSpinner className="animate-spin text-black/35 dark:text-white/35" />
                        ) : (
                            <span className="text-xs text-black/45 dark:text-white/45">Scroll for more</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
