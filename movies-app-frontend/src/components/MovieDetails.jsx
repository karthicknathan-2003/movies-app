import { useParams, useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useState } from "react";
import { tmdb } from "../api/tmdb";
import {
    BreadCrumbs,
    formatRuntime,
    getColor,
    getProfit,
    getVerdict,
    Legend,
    usd,
    Card,
    Row,
} from "@/utils/helper";

import {
    FaCalendarAlt,
    FaClock,
    FaGlobe,
    FaPlus,
    FaStar,
    FaHeart,
    FaShareAlt,
    FaFilm,
    FaMoneyBillWave,
    FaTrophy,
    FaChartLine,
    FaChartPie,
    FaCheck,
} from "react-icons/fa";

import { useWatchlist } from "./hooks/useWatchlist";
import { isLoggedIn } from "@/api/authService";
import { toast } from "sonner";
import AddToWatchlistModal from "@/components/AddToWatchlistModal";
import { watchlistApi } from "@/api/watchlist";

export default function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState(null);
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);

    const { addToWatchlist, updateFavorite } = useWatchlist();

    useEffect(() => {
        const loadMovie = async () => {
            setLoading(true);
            setError(false);
            try {
                const [movieRes, creditRes] = await Promise.all([
                    tmdb.get("/details", { params: { type: "MOVIE", id } }),
                    tmdb.get("/credits", { params: { type: "MOVIE", id } }),
                ]);
                const movieData = movieRes.data;
                setMovie(movieData);
                setCredits(creditRes.data);

                try {
                    const watchlistRes = await watchlistApi.get(`/${movieData.id}/status`);
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
        loadMovie();
    }, [id]);

    /* Open the modal — on close, re-check watchlist status so the button updates. */
    const handleWatchlist = useCallback(() => {
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/movies/${movie.id}`);
            toast.error("Please log in to manage your watchlist.");
            return;
        }
        setModalItem({
            movieId: movie.id,
            movieTitle: movie.title,
            mediaType: "movie",
            posterPath: movie.poster_path,
        });
        setModalOpen(true);
    }, [movie]);

    /* Re-check watchlist status when modal closes so the button reflects the latest state. */
    const handleModalClose = useCallback(async () => {
        setModalOpen(false);
        if (!movie) return;
        try {
            const res = await watchlistApi.get(`/${movie.id}/status`);
            setIsInWatchlist(res?.data?.inWatchlist ?? false);
            setIsFavorite(res?.data?.favorite ?? false);
        } catch {
            // 404 means still not in watchlist — keep current state.
        }
    }, [movie]);

    const handleFavorite = useCallback(async () => {
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/movies/${movie.id}`);
            toast.error("Please log in to manage your favorites.");
            return;
        }
        if (isFavorite) {
            await updateFavorite(movie.id, false);
            setIsFavorite(false);
            toast.success("Removed from favorites, still in watchlist.");
            return;
        }
        if (isInWatchlist && !isFavorite) {
            await updateFavorite(movie.id, true);
            setIsFavorite(true);
            toast.success("Added to favorites.");
            return;
        }
        await addToWatchlist({ id: movie.id, title: movie.title, favorite: true, mediaType: "movie" });
        setIsInWatchlist(true);
        setIsFavorite(true);
        toast.success("Added to favorites.");
    }, [movie, isInWatchlist, isFavorite, addToWatchlist, updateFavorite]);

    const handleShare = useCallback(() => {
        navigator.share?.({ title: movie.title, url: window.location.href });
    }, [movie]);

    if (loading) return <p className="text-center mt-10">Loading...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">Failed to load movie. Please refresh.</p>;
    if (!movie) return <p className="text-center mt-10">Movie not found.</p>;

    const director = credits?.crew?.find((c) => c.job === "Director")?.name;
    const producers = credits?.crew?.filter((c) => c.job === "Producer").map((p) => p.name);
    const topCast = credits?.cast?.slice(0, 12);
    const profit = getProfit(movie.budget, movie.revenue);
    const verdict = getVerdict(movie.budget, movie.revenue);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">

            <AddToWatchlistModal
                open={modalOpen}
                onClose={handleModalClose}
                mediaItem={modalItem}
            />

            <div
                className="relative h-75 bg-cover bg-center"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}
            >
                <div className="absolute inset-0 bg-black/60" />
                <BreadCrumbs
                    paths={[
                        { name: "Home",   to: "/" },
                        { name: "Movies", to: "/movies" },
                        { name: movie.title },
                    ]}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-24 relative">
                <div className="rounded-xl shadow-lg p-6 bg-white dark:bg-zinc-900">

                    <div className="flex flex-col md:flex-row gap-6">
                        <img
                            src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                            alt={movie.title}
                            className="w-44 rounded-xl shadow"
                        />

                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">{movie.title}</h1>

                            {movie.genres?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {movie.genres.map((genre) => (
                                        <span
                                            key={genre.id}
                                            className="px-3 py-1 text-xs md:text-sm rounded-full bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 hover:scale-105 transition-transform duration-200"
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="mt-3 max-w-3xl text-gray-700 dark:text-gray-300">{movie.overview}</p>

                            <div className="flex flex-wrap gap-4 text-sm mt-4 text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1 text-blue-500"><FaCalendarAlt /> {movie.release_date}</span>
                                <span className="flex items-center gap-1 text-orange-500"><FaClock /> {formatRuntime(movie.runtime)}</span>
                                <span className="flex items-center gap-1 text-green-500"><FaGlobe /> {movie.original_language.toUpperCase()}</span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm mt-4">
                                <Legend color="bg-[#186B3A]" label="Awesome" />
                                <Legend color="bg-[#28B562]" label="Great" />
                                <Legend color="bg-[#F4D13E]" label="Good" />
                                <Legend color="bg-[#F29D12]" label="Regular" />
                                <Legend color="bg-[#E64D3C]" label="Bad" />
                                <Legend color="bg-[#633875]" label="Garbage" />
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                                <button className={`px-3 py-1 rounded-lg text-xs font-semibold ${getColor(movie.vote_average)}`}>
                                    {movie.vote_average?.toFixed(1)}
                                </button>

                                {/* Watchlist button — green checkmark when already in any group. */}
                                <button
                                    onClick={handleWatchlist}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200
                                        ${isInWatchlist
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-[1.03]"
                                        }`}
                                >
                                    {isInWatchlist ? <><FaCheck size={12} /> In Watchlist</> : <><FaPlus size={12} /> Watchlist</>}
                                </button>

                                <button
                                    onClick={handleFavorite}
                                    className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 transition-all duration-200
                                        ${isFavorite
                                            ? "bg-red-600 text-white border-red-600"
                                            : "text-red-500 hover:bg-red-500/10 hover:scale-[1.03]"
                                        }`}
                                >
                                    <FaHeart /> {isFavorite ? "Favorited" : "Favorite"}
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 text-purple-500 hover:bg-purple-500/10 hover:scale-[1.03] transition-all duration-200"
                                >
                                    <FaShareAlt /> Share
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <h3 className="font-semibold mb-2">Crew</h3>
                            <p className="text-sm"><FaFilm /> <strong>Director:</strong> {director || "N/A"}</p>
                            <p className="text-sm mt-1"><FaFilm /> <strong>Producers:</strong> {producers?.join(", ") || "N/A"}</p>
                        </div>

                        <div className="p-6 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                            <h3 className="font-semibold mb-4">Box Office</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span><FaMoneyBillWave /> Budget</span><span>{usd(movie.budget)}</span></div>
                                <div className="flex justify-between font-semibold"><span><FaTrophy /> Collection</span><span>{usd(movie.revenue)}</span></div>
                                {profit !== null && (
                                    <div className="flex justify-between">
                                        <span>{profit > 0 ? <FaChartLine /> : <FaChartPie />} {profit > 0 ? "Profit" : "Loss"}</span>
                                        <span>{usd(Math.abs(profit))}</span>
                                    </div>
                                )}
                                {verdict && <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-500 text-white">{verdict}</span>}
                            </div>
                        </div>
                    </div>

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
            </div>
        </div>
    );
}