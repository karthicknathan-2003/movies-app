import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tmdb } from "../api/tmdb";
import { Grid } from "@/utils/helper";
import { FaFire } from "react-icons/fa";
import { GiSwordsPower } from "react-icons/gi";
import { useRecentlyViewed } from "@/components/hooks/useRecentlyViewed";
import RecentlyViewed from "@/components/RecentlyViewed";

export default function Home() {
    const navigate = useNavigate();
    const { recentlyViewed, clearAll } = useRecentlyViewed();
    const { addItem } = useRecentlyViewed();

    const [trending, setTrending] = useState([]);
    const [popularAnime, setPopularAnime] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState(false);

    const isAnime = (item) =>
        item.media_type === "tv" &&
        (item.genre_ids?.includes(16) || item.genres?.some(g => g.id === 16)) &&
        (item.origin_country?.includes("JP") ?? true);

    const goTo = useCallback((item) => {
        // Track the visit before navigating
        addItem({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            media_type: isAnime(item) ? "anime" : item.media_type,
        });

        if (item.media_type === "movie") return navigate(`/movies/${item.id}`);
        if (isAnime(item)) return navigate(`/anime/${item.id}`);
        navigate(`/series/${item.id}`);
    }, [navigate, addItem]);
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

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <div className="max-w-6xl mx-auto p-6">
                {pageError && (
                    <p className="mt-8 text-center text-red-500">
                        Failed to load content. Please refresh the page.
                    </p>
                )}

                {!pageError && (
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
                        <br />
                        <Grid
                            title="Popular Anime"
                            icon={<GiSwordsPower />}
                            iconColor="text-pink-500"
                            items={popularAnime}
                            onSelect={(item) => navigate(`/anime/${item.id}`)}
                            loading={pageLoading}
                        />

                        <RecentlyViewed items={recentlyViewed} clearAll={clearAll} />
                    </>
                )}
            </div>
        </div>
    );
}