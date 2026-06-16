import { formatRuntime, getColor } from "@/utils/helper";
import { useEffect, useState } from "react";

// Episodes do not always carry a runtime, so we fall back to the parent show's default runtime.
const getEpisodeRuntimeMinutes = (episode, fallbackRuntimeMinutes = 0) =>
    episode?.runtime
    || episode?.run_time
    || episode?.episode_run_time?.[0]
    || fallbackRuntimeMinutes
    || 0;

function EpisodeProgressCell({
    ep,
    seasonNumber,
    isWatched,
    onToggleWatched,
    fallbackRuntimeMinutes = 0,
}) {
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        if (!detailsOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (!event.target.closest("[data-episode-progress-cell]")) {
                setDetailsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, [detailsOpen]);

    if (!ep) return <div className="w-9 h-7" />;

    const ratingLabel = ep.vote_average?.toFixed(1) || "N/A";
    const runtimeLabel = formatRuntime(getEpisodeRuntimeMinutes(ep, fallbackRuntimeMinutes));

    return (
        <div className="group relative" data-episode-progress-cell>
            <button
                type="button"
                onClick={() => setDetailsOpen((value) => !value)}
                className={`relative flex h-7 w-9 items-center justify-center rounded border text-xs font-semibold cursor-pointer
                    ${getColor(ep.vote_average)}
                    ${isWatched ? "border-emerald-400 ring-2 ring-emerald-300/60 dark:ring-emerald-700/60" : "border-transparent"}`}
                aria-label={`Season ${seasonNumber}, episode ${ep.episode_number}`}
            >
                {ep.vote_average?.toFixed(1) || "NR"}
                {isWatched && (
                    <span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                )}
            </button>

            {/* Desktop hover card keeps the grid compact while still surfacing episode details. */}
            <div className="pointer-events-none absolute left-1/2 top-full z-30 hidden w-44 -translate-x-1/2 pt-2 md:block md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:pointer-events-auto md:group-hover:opacity-100">
                <div className="rounded-xl border border-black/10 bg-white/95 p-3 text-left text-[11px] shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-950/95">
                    <p className="font-semibold text-black dark:text-white line-clamp-2">{ep.name}</p>
                    <p className="mt-1 text-black/60 dark:text-white/60">Runtime: {runtimeLabel}</p>
                    <p className="text-black/60 dark:text-white/60">Rating: {ratingLabel}</p>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleWatched(ep, seasonNumber);
                        }}
                        className={`mt-2 w-full rounded-md px-2 py-1 font-medium transition
                            ${isWatched
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
                                : "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
                            }`}
                    >
                        {isWatched ? "Mark unwatched" : "Mark watched"}
                    </button>
                </div>
            </div>

            {/* Mobile click card exposes the same details on touch screens. */}
            {detailsOpen && (
                <div className="absolute left-1/2 top-full z-40 w-44 -translate-x-1/2 pt-2 md:hidden">
                    <div className="rounded-xl border border-black/10 bg-white/95 p-3 text-left text-[11px] shadow-lg backdrop-blur dark:border-white/10 dark:bg-zinc-950/95">
                        <p className="font-semibold text-black dark:text-white line-clamp-2">{ep.name}</p>
                        <p className="mt-1 text-black/60 dark:text-white/60">Runtime: {runtimeLabel}</p>
                        <p className="text-black/60 dark:text-white/60">Rating: {ratingLabel}</p>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleWatched(ep, seasonNumber);
                                setDetailsOpen(false);
                            }}
                            className={`mt-2 w-full rounded-md px-2 py-1 font-medium transition
                                ${isWatched
                                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
                                    : "bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
                                }`}
                        >
                            {isWatched ? "Mark unwatched" : "Mark watched"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const CHUNK_SIZE = 20;

export default function EpisodeProgressTable({
    seasonColumns,
    watchedEpisodeKeys = new Set(),
    onToggleWatched,
    defaultRuntimeMinutes = 0,
}) {
    if (!seasonColumns || seasonColumns.length === 0) return null;
    const rows = [];

    for (const season of seasonColumns) {
        const episodes = season.episodes ?? [];
        const totalChunks = Math.ceil(episodes.length / CHUNK_SIZE) || 1;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            rows.push({
                seasonNumber: season.season,
                label: chunkIndex === 0 ? `S${season.season}` : "",
                avg: chunkIndex === 0 ? season.avg : null,
                chunk: episodes.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE),
            });
        }
    }

    // Short seasons should only render the headers they actually need.
    const visibleHeaderCount = Math.max(
        1,
        ...rows.map((row) => row.chunk.length),
    );

    return (
        <div className="mt-6 overflow-x-auto md:overflow-visible">
            <table className="mb-6 min-w-max border-collapse text-center text-sm">
                <thead>
                    <tr>
                        <th className="sticky left-0 z-10 w-12 bg-white px-2 py-1 dark:bg-black">Season</th>
                        {Array.from({ length: visibleHeaderCount }).map((_, index) => (
                            <th key={index} className="px-1 py-1 text-xs">
                                E{index + 1}
                            </th>
                        ))}
                        <th className="px-2 py-1">AVG</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={`${row.seasonNumber}-${rowIndex}`}>
                            <td className="sticky left-0 z-10 w-12 bg-white px-2 py-1 font-semibold text-gray-800 dark:bg-black dark:text-gray-200">
                                {row.label}
                            </td>

                            {Array.from({ length: visibleHeaderCount }).map((_, episodeIndex) => {
                                const episode = row.chunk[episodeIndex];
                                const episodeKey = `${row.seasonNumber}-${episode?.episode_number}`;

                                return (
                                    <td key={episodeKey || `${row.seasonNumber}-empty-${episodeIndex}`} className="px-1 py-1">
                                        <EpisodeProgressCell
                                            ep={episode}
                                            seasonNumber={row.seasonNumber}
                                            isWatched={watchedEpisodeKeys.has(episodeKey)}
                                            onToggleWatched={onToggleWatched}
                                            fallbackRuntimeMinutes={defaultRuntimeMinutes}
                                        />
                                    </td>
                                );
                            })}

                            <td className="px-1 py-1">
                                {row.avg != null ? (
                                    <div className={`flex h-8 w-10 items-center justify-center rounded font-semibold ${getColor(row.avg)}`}>
                                        {row.avg.toFixed(1)}
                                    </div>
                                ) : (
                                    <div className="h-8 w-10" />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
