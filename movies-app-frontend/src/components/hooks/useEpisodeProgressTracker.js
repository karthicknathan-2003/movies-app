import { useCallback, useEffect, useMemo, useState } from "react";
import { isLoggedIn } from "@/api/authService";
import { getEpisodeProgress, updateEpisodeProgress } from "@/api/watchlist";
import { toast } from "sonner";

const getApiErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message || fallbackMessage;

const sortEpisodeProgress = (left, right) =>
    left.seasonNumber - right.seasonNumber || left.episodeNumber - right.episodeNumber;

/**
 * Custom hook to track episode progress for a given media item (e.g., TV show or anime).
 * It provides functionality to fetch, update, and manage the watched status of episodes.
 */
export function useEpisodeProgressTracker({
    mediaId,
    loginRedirectPath,
    seasonColumns,
    defaultEpisodeRuntime = 0,
}) {
    const [episodeProgress, setEpisodeProgress] = useState([]);
    const [seasonProgressLoading, setSeasonProgressLoading] = useState({});

    useEffect(() => {
        if (!mediaId || !isLoggedIn()) {
            setEpisodeProgress([]);
            return;
        }

        let ignore = false;
        const loadProgress = async () => {
            try {
                const res = await getEpisodeProgress(mediaId);
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
    }, [mediaId]);

    // Compute a set of watched episode keys for quick lookup, based on the current episode progress.
    const watchedEpisodeKeys = useMemo(
        () => new Set(episodeProgress.map((item) => `${item.seasonNumber}-${item.episodeNumber}`)),
        [episodeProgress],
    );

    // Compute the action state for each season, indicating whether all episodes are watched, loading, or disabled.
    const seasonActionState = useMemo(
        () => Object.fromEntries(
            seasonColumns.map((season) => {
                const episodes = season.episodes ?? [];
                const allWatched = episodes.length > 0
                    && episodes.every((episode) => watchedEpisodeKeys.has(`${season.season}-${episode.episode_number}`));

                return [season.season, {
                    allWatched,
                    loading: Boolean(seasonProgressLoading[season.season]),
                    disabled: Boolean(seasonProgressLoading[season.season]) || episodes.length === 0 || allWatched,
                }];
            }),
        ),
        [seasonColumns, seasonProgressLoading, watchedEpisodeKeys],
    );

    // Compute the total number of episodes across all seasons, for display purposes.
    const totalEpisodeCount = useMemo(
        () => seasonColumns.reduce((count, season) => count + (season.episodes?.length ?? 0), 0),
        [seasonColumns],
    );

    // Compute the total tracked minutes based on the watched episodes and their runtimes.
    const trackedMinutes = useMemo(
        () => episodeProgress.reduce(
            (minutes, item) => minutes + (item.runtimeMinutes > 0 ? item.runtimeMinutes : defaultEpisodeRuntime),
            0,
        ),
        [defaultEpisodeRuntime, episodeProgress],
    );

    // Handle toggling the watched status of a single episode.
    const handleEpisodeToggle = useCallback(async (episode, seasonNumber) => {
        if (!episode?.episode_number || !seasonNumber) {
            toast.error("Episode details are incomplete. Please refresh and try again.");
            return;
        }

        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", loginRedirectPath);
            toast.error("Please log in to track episode progress.");
            return;
        }

        const episodeKey = `${seasonNumber}-${episode.episode_number}`;
        const isCurrentlyWatched = watchedEpisodeKeys.has(episodeKey);
        const runtimeMinutes = Math.max(episode.runtime || defaultEpisodeRuntime || 0, 0);

        try {
            const res = await updateEpisodeProgress(mediaId, {
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
                return [...withoutDuplicate, res.data].sort(sortEpisodeProgress);
            });
        } catch (progressError) {
            console.error("Episode progress update failed:", progressError);
            toast.error(getApiErrorMessage(progressError, "Could not update episode progress."));
        }
    }, [defaultEpisodeRuntime, loginRedirectPath, mediaId, watchedEpisodeKeys]);

    // Handle marking all episodes in a season as watched.
    const handleSeasonToggle = useCallback(async (seasonNumber) => {
        const season = seasonColumns.find((item) => item.season === seasonNumber);

        if (!season || !season.episodes?.length) {
            toast.error("Season details are incomplete. Please refresh and try again.");
            return;
        }

        if (!isLoggedIn()) {
            sessionStorage.setItem("redirectAfterLogin", loginRedirectPath);
            toast.error("Please log in to track episode progress.");
            return;
        }

        const missingEpisodes = season.episodes.filter(
            (episode) => episode?.episode_number && !watchedEpisodeKeys.has(`${seasonNumber}-${episode.episode_number}`),
        );

        if (missingEpisodes.length === 0) {
            toast.success(`Season ${seasonNumber} is already fully watched.`);
            return;
        }

        setSeasonProgressLoading((current) => ({ ...current, [seasonNumber]: true }));
        try {
            const responses = await Promise.all(
                missingEpisodes.map((episode) => updateEpisodeProgress(mediaId, {
                    seasonNumber,
                    episodeNumber: episode.episode_number,
                    episodeName: episode.name,
                    runtimeMinutes: Math.max(episode.runtime || defaultEpisodeRuntime || 0, 0),
                    watched: true,
                })),
            );

            // Update the episode progress state with the newly marked episodes, ensuring no duplicates and sorting the result.
            setEpisodeProgress((current) => {
                const nextEntries = responses.map((response) => response.data);
                const existingEntries = current.filter((item) => item.seasonNumber !== seasonNumber
                    || !nextEntries.some((entry) => entry.episodeNumber === item.episodeNumber));

                return [...existingEntries, ...nextEntries].sort(sortEpisodeProgress);
            });
            toast.success(`Marked Season ${seasonNumber} as watched.`);
        } catch (progressError) {
            console.error("Season progress update failed:", progressError);
            toast.error(getApiErrorMessage(progressError, "Could not update season progress."));
        } finally {
            setSeasonProgressLoading((current) => ({ ...current, [seasonNumber]: false }));
        }
    }, [defaultEpisodeRuntime, loginRedirectPath, mediaId, seasonColumns, watchedEpisodeKeys]);

    return {
        episodeProgress,
        watchedEpisodeKeys,
        seasonActionState,
        totalEpisodeCount,
        trackedMinutes,
        handleEpisodeToggle,
        handleSeasonToggle,
    };
}
