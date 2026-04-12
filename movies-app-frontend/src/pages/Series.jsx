import React, { useEffect, useState, useCallback } from "react";
import { tmdb } from "../api/tmdb";
import { Card, SkeletonCard, BreadCrumbs } from "@/utils/helper";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";

const TOTAL_PAGES = 20;
const PAGE_SIZE = 20;

export default function Series() {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();

    const goToSeries = useCallback((id) => navigate(`/series/${id}`), [navigate]);

    const handlePageChange = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await tmdb.get("/tv/top-rated", { params: { page } });
                setSeries(res.data.results ?? []);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSeries();
    }, [page]);

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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Top TV Shows</h1>
                    <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                </div>

                {error && (
                    <p className="text-center text-red-500 mb-6">
                        Failed to load series. Please refresh the page.
                    </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
                    {loading
                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                        : series.map((item, index) => (
                            <div key={item.id} className="group hover:scale-101 transition">
                                <Card
                                    item={{ ...item, media_type: "tv" }}
                                    showType={false}
                                    showTitle={false}
                                    onClick={() => goToSeries(item.id)}
                                />
                                <div className="text-center mt-2">
                                    <span className="font-bold">{(page - 1) * PAGE_SIZE + index + 1}</span>
                                    <p className="text-sm line-clamp-2">{item.name}</p>
                                    <p className="text-xs opacity-60">{item.first_air_date?.slice(0, 4)}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {!loading && series.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                    </div>
                )}
            </div>
        </div>
    );
}