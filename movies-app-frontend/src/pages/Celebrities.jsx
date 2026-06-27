import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tmdb } from "../api/tmdb";
import { Card, SkeletonCard, BreadCrumbs, SEVEN_COLUMN_CARD_GRID_CLASS } from "@/utils/helper";
import Pagination from "@/components/Pagination";
import { FaSpinner } from "react-icons/fa";
import { useInfiniteScrollTrigger } from "@/components/hooks/useInfiniteScrollTrigger";
import { useAppSettings } from "@/components/context/AppSettingsContext";
import { useCatalogSearch } from "@/components/hooks/useCatalogSearch";
import CatalogSearchInput from "@/components/CatalogSearchInput";

const TOTAL_PAGES = 20;
const PAGE_SIZE = 20;

const mergeById = (current, incoming) => {
    const map = new Map(current.map((item) => [item.id, item]));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
};

export default function Celebrities() {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();
    const { query, setQuery, filtered } = useCatalogSearch(people);
    const { defaultViewMode: viewMode } = useAppSettings();

    const goToCelebrity = useCallback((id) => navigate(`/celebrities/${id}`), [navigate]);

    const handlePageChange = (nextPage) => {
        setPage(nextPage);
        if (viewMode === "pagination") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (viewMode === "pagination") {
            setPage(1);
        }
    }, [query, viewMode]);

    useEffect(() => {
        setPeople([]);
        setPage(1);
    }, [viewMode]);

    useEffect(() => {
        const fetchPeople = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await tmdb.get("/person/popular", { params: { page } });
                const nextResults = res.data.results ?? [];
                setPeople((current) =>
                    viewMode === "infinite" && page > 1 ? mergeById(current, nextResults) : nextResults,
                );
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPeople();
    }, [page, viewMode]);

    const infiniteSentinelRef = useInfiniteScrollTrigger({
        enabled: viewMode === "infinite" && !query.trim(),
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
                        { name: "Celebrities" },
                    ]}
                />

                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold shrink-0">Popular Celebrities</h1>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                            <CatalogSearchInput
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search loaded celebrities..."
                            />
                        {viewMode === "pagination" && (
                            <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                        )}
                        </div>
                    </div>

                    {viewMode === "infinite" && (
                        <p className="text-xs text-black/50 dark:text-white/50">
                            Infinite scroll is enabled from Settings and will keep loading more as you move down the page.
                        </p>
                    )}
                    </div>

                {error && (
                    <p className="text-center text-red-500 mb-6">
                        Failed to load celebrities. Please refresh the page.
                    </p>
                )}

                {!loading && filtered.length === 0 && query.trim() && (
                    <p className="text-center opacity-60 mt-10">
                        No celebrities found for "{query}".
                    </p>
                )}

                <div className={`${SEVEN_COLUMN_CARD_GRID_CLASS} gap-4 sm:gap-6`}>
                    {loading && people.length === 0
                        ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                        : filtered.map((person, index) => (
                            <div
                                key={person.id}
                                className="group cursor-pointer"
                                onClick={() => goToCelebrity(person.id)}
                            >
                                <Card
                                    item={{
                                        ...person,
                                        media_type: "person",
                                        poster_path: person.profile_path,
                                    }}
                                    showType={true}
                                    showTitle={false}
                                />
                                <div className="text-center mt-2">
                                    <span className="font-bold">
                                        {viewMode === "infinite" ? index + 1 : ((page - 1) * PAGE_SIZE) + index + 1}
                                    </span>
                                    <p className="text-sm font-medium line-clamp-2">{person.name}</p>
                                    <p className="text-xs opacity-60">{person.known_for_department}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {viewMode === "pagination" && !loading && people.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                    </div>
                )}

                {viewMode === "infinite" && !query.trim() && page < TOTAL_PAGES && (
                    <div ref={infiniteSentinelRef} className="flex justify-center py-8">
                        {loading && people.length > 0 ? (
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