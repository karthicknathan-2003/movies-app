import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tmdb } from "../api/tmdb";
import { Card, SkeletonCard, BreadCrumbs } from "@/utils/helper";
import Pagination from "@/components/Pagination";

const TOTAL_PAGES = 20;
const PAGE_SIZE = 20;

export default function Celebrities() {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();

    const goToCelebrity = useCallback((id) => navigate(`/celebrities/${id}`), [navigate]);

    const handlePageChange = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        const fetchPeople = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await tmdb.get("/person/popular", { params: { page } });
                setPeople(res.data.results ?? []);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPeople();
    }, [page]);

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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Popular Celebrities</h1>
                    <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                </div>

                {error && (
                    <p className="text-center text-red-500 mb-6">
                        Failed to load celebrities. Please refresh the page.
                    </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
                    {loading
                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                        : people.map((person, index) => (
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
                                    <span className="font-bold">{(page - 1) * PAGE_SIZE + index + 1}</span>
                                    <p className="text-sm font-medium line-clamp-2">{person.name}</p>
                                    <p className="text-xs opacity-60">{person.known_for_department}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {!loading && people.length > 0 && (
                    <div className="flex justify-center mt-10">
                        <Pagination page={page} totalPages={TOTAL_PAGES} onPageChange={handlePageChange} />
                    </div>
                )}
            </div>
        </div>
    );
}