import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tmdb } from "../api/tmdb";
import { Grid } from "@/utils/helper";
import { FaFire } from "react-icons/fa";
import { GiSwordsPower } from "react-icons/gi";
import { useRecentlyViewed } from "@/components/hooks/useRecentlyViewed";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useAppSettings } from "@/components/context/AppSettingsContext";
import { useWatchlistIds } from "@/components/hooks/useWatchlistIds";

export default function Home() {
    const navigate = useNavigate();
    const { recentlyViewedEnabled } = useAppSettings();
    const { recentlyViewed, clearAll, addItem } = useRecentlyViewed();
    const watchlistIds = useWatchlistIds();

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

    const featuredTitle = trending[0] || popularAnime[0] || null;
    const featuredMeta = featuredTitle
        ? [
            featuredTitle.media_type === "movie" ? "Movie" : (isAnime(featuredTitle) ? "Anime" : "Series"),
            featuredTitle.release_date?.slice(0, 4) || featuredTitle.first_air_date?.slice(0, 4),
            featuredTitle.vote_average ? `${featuredTitle.vote_average.toFixed(1)} rating` : null,
        ].filter(Boolean)
        : [];

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                {pageError && (
                    <p className="mt-8 text-center text-red-500">
                        Failed to load content. Please refresh the page.
                    </p>
                )}

                {!pageError && (
                    <>
                        <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-zinc-950 text-white shadow-xl dark:border-white/10">
                            {featuredTitle && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-65"
                                        style={{
                                            backgroundImage: `url(https://image.tmdb.org/t/p/original${featuredTitle.backdrop_path || featuredTitle.poster_path})`,
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
                                </>
                            )}

                            <div className="relative grid gap-6 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:gap-10 lg:px-10 lg:py-12">
                                <div className="max-w-2xl">
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                                        Featured tonight
                                    </p>

                                    {pageLoading ? (
                                        <div className="mt-4 space-y-3">
                                            <div className="h-10 w-3/4 rounded-full bg-white/10" />
                                            <div className="h-4 w-full rounded-full bg-white/10" />
                                            <div className="h-4 w-5/6 rounded-full bg-white/10" />
                                        </div>
                                    ) : featuredTitle ? (
                                        <>
                                            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                                                {featuredTitle.title || featuredTitle.name}
                                            </h1>
                                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80 sm:text-sm">
                                                {featuredMeta.map((meta) => (
                                                    <span key={meta} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 backdrop-blur-sm">
                                                        {meta}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="mt-4 max-w-xl text-sm leading-6 text-white/78 sm:text-base">
                                                {featuredTitle.overview || "Open the featured pick and keep exploring from the latest trending titles."}
                                            </p>

                                            <div className="mt-6 flex flex-wrap gap-3">
                                                <button
                                                    onClick={() => goTo(featuredTitle)}
                                                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                                                >
                                                    Open title
                                                </button>
                                                <button
                                                    onClick={() => navigate("/anime")}
                                                    className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                                                >
                                                    Browse anime
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="mt-4">
                                            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                                                Welcome back to CineVault
                                            </h1>
                                            <p className="mt-3 max-w-xl text-sm leading-6 text-white/78 sm:text-base">
                                                Trending picks and anime favorites will show up here as soon as the feed finishes loading.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                                        This week at a glance
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-black/25 p-4">
                                            <p className="text-xs text-white/65">Trending now</p>
                                            <p className="mt-1 text-2xl font-bold">{trending.length}</p>
                                        </div>
                                        <div className="rounded-2xl bg-black/25 p-4">
                                            <p className="text-xs text-white/65">Anime picks</p>
                                            <p className="mt-1 text-2xl font-bold">{popularAnime.length}</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-white/72">
                                        Start with the featured title, then jump into trending movies, series, and anime without leaving the homepage.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <Grid
                            title="Trending This Week"
                            icon={<FaFire />}
                            iconColor="text-orange-500"
                            items={trending}
                            onSelect={goTo}
                            loading={pageLoading}
                            showType
                            watchlistIds={watchlistIds}
                        />
                        <br />
                        <Grid
                            title="Popular Anime"
                            icon={<GiSwordsPower />}
                            iconColor="text-pink-500"
                            items={popularAnime}
                            onSelect={(item) => navigate(`/anime/${item.id}`)}
                            loading={pageLoading}
                            watchlistIds={watchlistIds}
                        />

                        {recentlyViewedEnabled && (
                            <RecentlyViewed items={recentlyViewed} clearAll={clearAll} watchlistIds={watchlistIds} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
