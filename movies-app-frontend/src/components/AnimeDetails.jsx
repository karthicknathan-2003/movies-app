import { useNavigate, useParams } from "react-router-dom";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { tmdb } from "../api/tmdb";
import { BreadCrumbs, DetailPageSkeleton, Legend, Row } from "@/utils/helper";
import { FaPlus, FaHeart, FaShareAlt, FaCheck, FaFilm } from "react-icons/fa";
import { GiSwordsPower } from "react-icons/gi";
import { useWatchlist } from "./hooks/useWatchlist";
import { isLoggedIn } from "@/api/authService";
import { toast } from "sonner";
import PersonalStarRating from "@/components/PersonalStarRating";
import { getEpisodeProgress, optionalAuthRequestConfig, updateEpisodeProgress, updatePersonalRating, watchlistApi } from "@/api/watchlist";
import AddToWatchlistModal from "@/components/AddToWatchlistModal";
import UserReviews from "./UserReviews";
import EpisodeProgressTable from "@/components/EpisodeProgressTable";
import EpisodeInsights from "@/components/EpisodeInsights";
import { useWatchlistIds } from "./hooks/useWatchlistIds";

const getApiErrorMessage = (error, fallbackMessage) => {
    // Prefer the backend message so validation failures are easier to debug from the UI.
    return error?.response?.data?.message || fallbackMessage;
};

const isNotFoundError = (error) => error?.response?.status === 404;

export default function AnimeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [show, setShow] = useState(null);
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [similarTitles, setSimilarTitles] = useState([]);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [personalRating, setPersonalRating] = useState(null);
    const [episodeProgress, setEpisodeProgress] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);

    const { addToWatchlist, updateFavorite } = useWatchlist();
    const watchlistIds = useWatchlistIds();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(false);
            try {
                const [res, similarRes] = await Promise.all([
                    tmdb.get(`/anime/${id}/seasons`),
                    tmdb.get("/similar", { params: { type: "TV", id } }),
                ]);
                const showData = res.data;
                setShow(showData);
                setSimilarTitles((similarRes.data?.results ?? []).slice(0, 10).map((item) => ({
                    ...item,
                    media_type: "tv",
                })));
                setSeasons(
                    (showData.seasons ?? []).filter(
                        (season) => season.season_number > 0 && season.episodes?.length > 0,
                    ),
                );

                try {
                    const watchlistRes = await watchlistApi.get(`/${showData.id}/status`, optionalAuthRequestConfig);
                    if (watchlistRes?.data?.inWatchlist) {
                        setIsInWatchlist(true);
                        setIsFavorite(watchlistRes.data.favorite);
                        setPersonalRating(watchlistRes.data.personalRating ?? null);
                    } else {
                        setPersonalRating(null);
                    }
                } catch (watchlistError) {
                    if (!isNotFoundError(watchlistError)) {
                        console.error("Watchlist status check failed:", watchlistError);
                        return;
                    }
                    setIsInWatchlist(false);
                    setIsFavorite(false);
                    setPersonalRating(null);
                }
            } catch (requestError) {
                console.error("Anime details load failed:", requestError);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        if (!id || !isLoggedIn()) {
            setEpisodeProgress([]);
            return;
        }

        let ignore = false;

        const loadProgress = async () => {
            try {
                const res = await getEpisodeProgress(id);
                if (!ignore) {
                    setEpisodeProgress(res.data ?? []);
                }
            } catch (progressError) {
                console.error("Episode progress load failed:", progressError);
                if (!ignore) {
                    setEpisodeProgress([]);
                }
            }
        };

        loadProgress();
        return () => {
            ignore = true;
        };
    }, [id]);

    const handleWatchlist = useCallback(() => {
        if (!show) return;
        if (!show?.id || !show?.name) {
            toast.error("Anime details are still loading. Please try again.");
            return;
        }
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/anime/${show.id}`);
            toast.error("Please log in to manage your watchlist.");
            return;
        }
        setModalItem({
            movieId: show.id,
            movieTitle: show.name,
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
            setPersonalRating(res?.data?.personalRating ?? null);
        } catch (error) {
            // Only clear local watchlist state when the backend confirms the title is absent.
            if (isNotFoundError(error)) {
                setIsInWatchlist(false);
                setIsFavorite(false);
                setPersonalRating(null);
            }
        }
    }, [show]);

    const handleFavorite = useCallback(async () => {
        if (!show) return;
        if (!show?.id || !show?.name) {
            toast.error("Anime details are still loading. Please try again.");
            return;
        }
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/anime/${show.id}`);
            toast.error("Please log in to manage your favorites.");
            return;
        }
        try {
            if (isFavorite) {
                await updateFavorite(show.id, false);
                setIsFavorite(false);
                toast.success("Removed from favorites.");
                return;
            }
            if (isInWatchlist && !isFavorite) {
                await updateFavorite(show.id, true);
                setIsFavorite(true);
                toast.success("Added to favorites.");
                return;
            }
            await addToWatchlist({ id: show.id, title: show.name, favorite: true, mediaType: "TV" });
            setIsInWatchlist(true);
            setIsFavorite(true);
            toast.success("Added to favorites.");
        } catch (favoriteError) {
            console.error("Favorite update failed:", favoriteError);
            toast.error(getApiErrorMessage(favoriteError, "Could not update favorite."));
        }
    }, [show, isInWatchlist, isFavorite, addToWatchlist, updateFavorite]);

    const handleShare = useCallback(() => {
        if (!show?.name) {
            toast.error("Anime details are still loading. Please try again.");
            return;
        }
        navigator.share?.({ title: show.name, url: window.location.href });
    }, [show]);

    const handleRatingChange = useCallback(async (nextRating) => {
        if (!show) return;
        if (nextRating != null && (nextRating < 1 || nextRating > 5)) {
            toast.error("Rating must be between 1 and 5.");
            return;
        }

        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/anime/${show.id}`);
            toast.error("Please log in to rate this title.");
            return;
        }

        if (!isInWatchlist) {
            toast.error("Add this title to your watchlist to save a rating.");
            setModalItem({
                movieId: show.id,
                movieTitle: show.name,
                mediaType: "tv",
                posterPath: show.poster_path,
            });
            setModalOpen(true);
            return;
        }

        const previousRating = personalRating;
        setPersonalRating(nextRating);
        try {
            await updatePersonalRating(show.id, nextRating);
        } catch (errorState) {
            console.error("Personal rating update failed:", errorState);
            setPersonalRating(previousRating);
            toast.error(getApiErrorMessage(errorState, "Could not save your rating."));
        }
    }, [isInWatchlist, personalRating, show]);

    // The progress table handles chunking internally, so we keep each season's raw episode list here.
    const seasonColumns = seasons.map((season) => ({
        season: season.season_number,
        episodes: season.episodes ?? [],
        avg: (season.episodes ?? []).reduce((total, episode) => total + (episode.vote_average || 0), 0)
            / ((season.episodes ?? []).length || 1),
    }));

    const watchedEpisodeKeys = useMemo(
        () => new Set(episodeProgress.map((item) => `${item.seasonNumber}-${item.episodeNumber}`)),
        [episodeProgress],
    );
    const totalEpisodeCount = seasonColumns.reduce(
        (count, season) => count + (season.episodes?.length ?? 0),
        0,
    );
    // Optional chaining avoids a crash before the show payload is fully available.
    const defaultEpisodeRuntime = show?.episode_run_time?.[0] || 0;
    // Older progress rows may still have 0 runtime saved, so fall back to the show default when needed.
    const trackedMinutes = episodeProgress.reduce(
        (minutes, item) => minutes + (item.runtimeMinutes > 0 ? item.runtimeMinutes : defaultEpisodeRuntime),
        0,
    );

    const handleEpisodeToggle = useCallback(async (episode, seasonNumber) => {
        if (!episode?.episode_number || !seasonNumber) {
            toast.error("Episode details are incomplete. Please refresh and try again.");
            return;
        }
        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", `/anime/${id}`);
            toast.error("Please log in to track episode progress.");
            return;
        }

        const episodeKey = `${seasonNumber}-${episode.episode_number}`;
        const isCurrentlyWatched = watchedEpisodeKeys.has(episodeKey);
        const runtimeMinutes = Math.max(episode.runtime || defaultEpisodeRuntime || 0, 0);

        try {
            const res = await updateEpisodeProgress(id, {
                seasonNumber,
                episodeNumber: episode.episode_number,
                episodeName: episode.name,
                runtimeMinutes,
                watched: !isCurrentlyWatched,
            });

            setEpisodeProgress((current) => {
                if (isCurrentlyWatched) {
                    return current.filter(
                        (item) => !(item.seasonNumber === seasonNumber && item.episodeNumber === episode.episode_number),
                    );
                }

                const withoutDuplicate = current.filter(
                    (item) => !(item.seasonNumber === seasonNumber && item.episodeNumber === episode.episode_number),
                );
                return [...withoutDuplicate, res.data].sort(
                    (left, right) => left.seasonNumber - right.seasonNumber || left.episodeNumber - right.episodeNumber,
                );
            });
        } catch (progressError) {
            console.error("Episode progress update failed:", progressError);
            toast.error(getApiErrorMessage(progressError, "Could not update episode progress."));
        }
    }, [defaultEpisodeRuntime, id, watchedEpisodeKeys]);

    if (loading) return <DetailPageSkeleton />;
    if (error) return <p className="text-center mt-10 text-red-500">Failed to load anime. Please refresh.</p>;
    if (!show) return <p className="text-center mt-10">Anime not found.</p>;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <AddToWatchlistModal
                open={modalOpen}
                onClose={handleModalClose}
                mediaItem={modalItem}
            />
            <div
                className="relative h-70 bg-cover bg-center"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${show.backdrop_path})` }}
            >
                <div className="absolute inset-0 bg-black/60" />
                <BreadCrumbs
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Anime", to: "/anime" },
                        { name: show.name },
                    ]}
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-24 relative">
                <div className="rounded-xl shadow-lg p-6 bg-white dark:bg-zinc-900">
                    <div className="flex flex-col md:flex-row gap-6">
                        <img
                            src={`https://image.tmdb.org/t/p/w300${show.poster_path}`}
                            alt={show.name}
                            className="w-40 rounded-xl shadow object-cover"
                        />

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-3xl font-bold">{show.name}</h1>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400">
                                    <GiSwordsPower /> Anime
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

                                <div className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 dark:border-white/10">
                                    <span className="text-sm font-medium text-black/60 dark:text-white/60">Your rating</span>
                                    <PersonalStarRating value={personalRating || 0} onChange={handleRatingChange} />
                                </div>

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

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Episodes watched</p>
                            <p className="mt-1 text-2xl font-bold">{episodeProgress.length}</p>
                        </div>
                        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Progress</p>
                            <p className="mt-1 text-2xl font-bold">{episodeProgress.length}/{totalEpisodeCount || 0}</p>
                        </div>
                        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Tracked time</p>
                            <p className="mt-1 text-2xl font-bold">{(trackedMinutes / 60).toFixed(1)}h</p>
                        </div>
                    </div>

                    {/* Reuse the same analytics block across TV and anime detail pages for a consistent UX. */}
                    <EpisodeInsights seasonColumns={seasonColumns} />

                    {seasonColumns.length > 0
                        ? <EpisodeProgressTable
                            seasonColumns={seasonColumns}
                            watchedEpisodeKeys={watchedEpisodeKeys}
                            onToggleWatched={handleEpisodeToggle}
                            defaultRuntimeMinutes={defaultEpisodeRuntime}
                        />
                        : <p className="mt-6 text-center text-gray-500 dark:text-gray-400">No episode data available.</p>
                    }

                    <Row
                        title="Similar Titles"
                        items={similarTitles}
                        loading={loading}
                        showType
                        icon={<FaFilm />}
                        iconColor="text-violet-500"
                        watchlistIds={watchlistIds}
                        onSelect={(item) => navigate(`/anime/${item.id}`)}
                    />
                </div>
                <UserReviews mediaType="ANIME" />
            </div>
        </div>
    );
}
