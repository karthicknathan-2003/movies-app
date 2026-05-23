import { useNavigate, useParams } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import { tmdb } from "../api/tmdb";
import { BreadCrumbs, DetailPageSkeleton, EpisodeTableHorizontal, Legend, Row } from "@/utils/helper";

import { FaPlus, FaStar, FaHeart, FaShareAlt, FaCheck, FaTv, FaFilm } from "react-icons/fa";
import { useWatchlist } from "./hooks/useWatchlist";
import { isLoggedIn } from "@/api/authService";
import { toast } from "sonner";
import { watchlistApi } from "@/api/watchlist";
import AddToWatchlistModal from "@/components/AddToWatchlistModal";
import UserReviews from "./UserReviews";
import WatchProviders from "./WatchProviders";

export default function SeriesDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [credits, setCredits] = useState(null);
    const [show, setShow] = useState(null);
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);

    const { addToWatchlist, updateFavorite } = useWatchlist();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(false);
            try {
                const [res, creditRes] = await Promise.all([
                    tmdb.get(`/series/${id}/seasons`),
                    tmdb.get("/credits", { params: { type: "TV", id } }),
                ]);
                const showData = res.data;
                setShow(showData);
                setCredits(creditRes.data);
                // Filter out Season 0 (Specials) and seasons with no episodes.
                setSeasons(
                    (showData.seasons ?? []).filter(
                        (s) => s.season_number > 0 && s.episodes?.length > 0
                    )
                );

                try {
                    const watchlistRes = await watchlistApi.get(`/${showData.id}/status`);
                    if (watchlistRes?.data?.inWatchlist) {
                        setIsInWatchlist(true);
                        setIsFavorite(watchlistRes.data.favorite);
                    }
                } catch (e) {
                    if (e.response?.status !== 404) console.error("Watchlist status check failed:", e);
                    setIsInWatchlist(false);
                    setIsFavorite(false);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleWatchlist = useCallback(() => {
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/series/${show.id}`);
            toast.error("Please log in to manage your watchlist.");
            return;
        }
        setModalItem({
            movieId: show.id,
            movieTitle: show.title || show.name,
            mediaType: "tv",
            posterPath: show.poster_path,
        });
        setModalOpen(true);
    }, [show]);

    const handleModalClose = useCallback(async () => {
        setModalOpen(false);
        if (!show) return;
        try {
            const res = await watchlistApi.get(`/${show.id}/status`);
            setIsInWatchlist(res?.data?.inWatchlist ?? false);
            setIsFavorite(res?.data?.favorite ?? false);
        } catch {
            // 404 means still not in watchlist — keep current state.
        }
    }, [show]);

    const handleFavorite = useCallback(async () => {
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/series/${show.id}`);
            toast.error("Please log in to manage your favorites.");
            return;
        }
        if (isFavorite) {
            await updateFavorite(show.id, false);
            setIsFavorite(false);
            toast.success("Removed from favorites, still in watchlist.");
            return;
        }
        if (isInWatchlist && !isFavorite) {
            await updateFavorite(show.id, true);
            setIsFavorite(true);
            toast.success("Added to favorites.");
            return;
        }
        await addToWatchlist({ id: show.id, title: show.title || show.name, favorite: true, mediaType: "TV" });
        setIsInWatchlist(true);
        setIsFavorite(true);
        toast.success("Added to favorites.");
    }, [show, isInWatchlist, isFavorite, addToWatchlist, updateFavorite]);

    const handleShare = useCallback(() => {
        navigator.share?.({ title: show.title || show.name, url: window.location.href });
    }, [show]);

    if (loading) return <DetailPageSkeleton />;
    if (error) return <p className="text-center mt-10 text-red-500">Failed to load series. Please refresh.</p>;
    if (!show) return <p className="text-center mt-10">Series not found.</p>;

    // Pass full episode arrays — EpisodeTableHorizontal handles chunking internally.
    // Pre-chunking here caused double-splitting, making one season appear as two rows.
    const seasonColumns = seasons.map((s) => ({
        season: s.season_number,
        episodes: s.episodes ?? [],
        avg: (s.episodes ?? []).reduce((a, e) => a + (e.vote_average || 0), 0)
            / ((s.episodes ?? []).length || 1),
    }));

    const director = credits?.crew?.filter((c) => c.job === "Director" || c.job === "Executive Producer").map((p) => p.name);
    const producers = credits?.crew?.filter((c) => c.job === "Producer").map((p) => p.name);
    const topCast = credits?.cast?.slice(0, 12);

    return (
        window.scrollTo(0, 0),
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <AddToWatchlistModal
                open={modalOpen}
                onClose={handleModalClose}
                mediaItem={modalItem}
            />
            <div
                className="relative h-75 bg-cover bg-center"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${show.backdrop_path})` }}
            >
                <div className="absolute inset-0 bg-black/60" />
                <BreadCrumbs
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Series", to: "/series" },
                        { name: show.title || show.name },
                    ]}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-24 relative">
                <div className="rounded-xl shadow-lg p-6 bg-white dark:bg-zinc-900">

                    <div className="flex flex-col md:flex-row gap-6">
                        <img
                            src={`https://image.tmdb.org/t/p/w300${show.poster_path}`}
                            alt={show.title || show.name}
                            className="w-40 h-70 rounded-xl shadow object-cover"
                        />

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-3xl font-bold">{show.title || show.name}</h1>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                    <FaTv /> Series
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                                {show.seasons?.length > 0 && <span>{show.seasons.length} Season{show.seasons.length > 1 ? "s" : ""}</span>}
                                {show.number_of_episodes && <span>· {show.number_of_episodes} Episodes</span>}
                                {show.first_air_date && <span>· {show.first_air_date.slice(0, 4)}</span>}
                                {show.vote_average && <span>· ⭐ {show.vote_average.toFixed(1)}</span>}
                            </div>

                            <p className="mt-3 max-w-3xl text-gray-700 dark:text-gray-300">{show.overview}</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    onClick={handleWatchlist}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer
                                        ${isInWatchlist
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-[1.03]"
                                        }`}
                                >
                                    {isInWatchlist ? <><FaCheck size={12} /> In Watchlist</> : <><FaPlus size={12} /> Watchlist</>}
                                </button>

                                <button className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 text-yellow-500 cursor-pointer transition-all duration-200 hover:bg-yellow-500/10 hover:scale-[1.03]">
                                    <FaStar /> Rate
                                </button>

                                <button
                                    onClick={handleFavorite}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 transition-all duration-200 cursor-pointer
                                        ${isFavorite
                                            ? "bg-red-600 text-white border-red-600"
                                            : "text-red-500 hover:bg-red-500/10 hover:scale-[1.03]"
                                        }`}
                                >
                                    <FaHeart /> {isFavorite ? "Favorited" : "Favorite"}
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 text-purple-500 cursor-pointer transition-all duration-200 hover:bg-purple-500/10 hover:scale-[1.03]"
                                >
                                    <FaShareAlt /> Share
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 mt-6">
                        <Legend color="bg-[#186B3A]" label="Awesome" />
                        <Legend color="bg-[#28B562]" label="Great" />
                        <Legend color="bg-[#F4D13E]" label="Good" />
                        <Legend color="bg-[#F29D12]" label="Regular" />
                        <Legend color="bg-[#E64D3C]" label="Bad" />
                        <Legend color="bg-[#633875]" label="Garbage" />
                    </div>

                    <div className="mt-10 grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <div className="flex items-center gap-2 mb-4">
                                <FaFilm />
                                <h3 className="font-bold">Crew</h3>
                            </div>
                            <p className="text-sm"><strong>Director:</strong> {director?.join(", ") || "N/A"}</p>
                            <p className="text-sm mt-1"><strong>Producers:</strong> {producers?.join(", ") || "N/A"}</p>
                        </div>

                        <WatchProviders
                            mediaType="TV"
                            id={show.id}
                        />
                    </div>

                    {seasonColumns.length > 0
                        ? <EpisodeTableHorizontal seasonColumns={seasonColumns} />
                        : <p className="mt-6 text-center text-gray-500 dark:text-gray-400">No episode data available.</p>
                    }

                    <Row
                        title="Top Cast"
                        items={topCast}
                        loading={loading}
                        showType={false}
                        icon={<FaFilm />}
                        iconColor="text-blue-500"
                        onSelect={(item) => navigate(`/celebrities/${item.id}`)}
                    />
                </div>
                <UserReviews mediaType="tv" />
            </div>
        </div>
    );
}