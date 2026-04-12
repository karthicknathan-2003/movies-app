import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tmdb } from "@/api/tmdb";
import { BreadCrumbs, Row } from "@/utils/helper";

import {
    FaBirthdayCake,
    FaMapMarkerAlt,
    FaFilm,
    FaStar,
} from "react-icons/fa";

export default function PersonDetails() {
    const [actor, setActor] = useState(null);
    const [movies, setMovies] = useState([]);

    // Start as true to avoid a flash of empty content before data arrives.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    /* Fetch actor details and derive their sorted filmography on mount.
       Re-runs when the route param changes e.g. navigating between celebrities. */
    useEffect(() => {
        const loadActor = async () => {
            setLoading(true);
            setError(false);

            try {
                const actorRes = await tmdb.get(`/person/${id}`);
                const actorData = actorRes.data;
                setActor(actorData);

                // Sort combined credits by rating descending so the best work appears first.
                const sortedMovies = actorData.combined_credits?.cast
                    ?.sort((a, b) => b.vote_average - a.vote_average) ?? [];

                setMovies(sortedMovies);
            } catch {
                // Surface a page-level error instead of silently failing.
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        loadActor();
    }, [id]);

    /* Navigate to the correct detail page based on the item's media type.
       Memoized to avoid recreating the function on every render. */
    const handleSelect = useCallback((item) => {
        const path = item.media_type === "movie"
            ? `/movies/${item.id}`
            : `/series/${item.id}`;
        navigate(path);
    }, [navigate]);

    if (loading) return <p className="text-center mt-10">Loading...</p>;
    if (error)   return <p className="text-center mt-10 text-red-500">Failed to load celebrity. Please refresh.</p>;
    if (!actor)  return <p className="text-center mt-10">Actor not found.</p>;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Hero backdrop — uses the actor's profile photo, overlaid with a dark scrim. */}
            <div
                className="relative h-72 bg-cover bg-center"
                style={{
                    backgroundImage: `url(https://image.tmdb.org/t/p/original${actor.profile_path})`,
                }}
            >
                <div className="absolute inset-0 bg-black/70" />
                <BreadCrumbs
                    paths={[
                        { name: "Home", to: "/" },
                        { name: "Celebrities", to: "/celebrities" },
                        { name: actor.name },
                    ]}
                />
            </div>

            {/* Main content card — overlaps the hero with a negative top margin. */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-24 relative">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row gap-6">

                        {/* Profile photo — falls back to a local avatar if no image is available. */}
                        <img
                            src={
                                actor.profile_path
                                    ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                                    : "/avatar-fallback.png"
                            }
                            alt={actor.name}
                            className="w-48 h-80 rounded-xl shadow object-cover"
                        />

                        {/* Actor info — biography, birthday, birthplace, department, and popularity. */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">{actor.name}</h1>
                            <p className="mt-3 text-gray-700 dark:text-gray-300 max-w-3xl">
                                {actor.biography || "No biography available."}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-sm text-gray-600 dark:text-gray-400">
                                {/* Birthday — only rendered when the data is available. */}
                                {actor.birthday && (
                                    <span className="flex items-center gap-2">
                                        <FaBirthdayCake className="text-pink-500" />
                                        {actor.birthday}
                                    </span>
                                )}

                                {/* Place of birth — only rendered when the data is available. */}
                                {actor.place_of_birth && (
                                    <span className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-green-500" />
                                        {actor.place_of_birth}
                                    </span>
                                )}

                                <span className="flex items-center gap-2">
                                    <FaFilm className="text-blue-500" />
                                    {actor.known_for_department}
                                </span>

                                <span className="flex items-center gap-2">
                                    <FaStar className="text-yellow-400" />
                                    Popularity: {actor.popularity?.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Known For row — sorted by rating so the actor's best work appears first. */}
                    <Row
                        title="Known For"
                        items={movies}
                        loading={loading}
                        showType={true}
                        icon={<FaFilm />}
                        iconColor="text-blue-500"
                        onSelect={handleSelect}
                    />
                </div>
            </div>
        </div>
    );
}