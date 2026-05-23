import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import { ArrowLeft } from "lucide-react";
import { FaFilm, FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

// Conversion rate used to display budgets and revenues in Indian Rupees.
export const USD_TO_INR = 83;

// Maps a rating value to a background and text color class for visual grading.
export const getColor = (rating) => {
    if (rating >= 9) return "bg-[#186B3A] text-white"; // Awesome.
    if (rating >= 8 && rating < 9) return "bg-[#28B562] text-black"; // Great.
    if (rating >= 7 && rating < 8) return "bg-[#F4D13E] text-black"; // Good.
    if (rating >= 6 && rating < 7) return "bg-[#F29D12] text-black"; // Regular.
    if (rating >= 5 && rating < 6) return "bg-[#E64D3C] text-white"; // Bad.
    if (rating >= 4 && rating < 5) return "bg-[#633875] text-white"; // Garbage.
    return "bg-[#BDBDBD] text-black";                                // Unrated.
};

// Formats a number as a USD string — returns "N/A" if the value is falsy or zero.
export const usd = (n) => (n && n > 0 ? `$${n.toLocaleString()}` : "N/A");

// Converts a USD value to INR and formats it — returns "N/A" if the value is falsy or zero.
export const inr = (n) =>
    n && n > 0 ? `₹${(n * USD_TO_INR).toLocaleString("en-IN")}` : "N/A";

// Calculates raw profit from budget and revenue — returns null if either value is missing.
export const getProfit = (budget, revenue) =>
    budget && revenue ? revenue - budget : null;

// Determines a box office verdict based on the revenue-to-budget ratio.
export const getVerdict = (budget, revenue) => {
    if (!budget || !revenue) return null;
    const ratio = revenue / budget;
    if (ratio >= 3) return "Blockbuster";
    if (ratio >= 1.5) return "Hit";
    if (ratio >= 1) return "Average";
    return "Flop";
};

// Converts a runtime in minutes to a human-readable "Xh Ym" format.
export const formatRuntime = (mins) => {
    if (!mins) return "N/A";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
};

// Builds a full TMDB image URL from a poster path — falls back to a local placeholder.
export const getPoster = (path) =>
    path ? `https://image.tmdb.org/t/p/w300${path}` : "/poster-fallback.png";

/* Skeleton placeholder shown while a card's image and data are loading. */
export function SkeletonCard() {
    return (
        <div className="min-w-[150px] space-y-3">
            {/* Poster placeholder. */}
            <Skeleton className="h-[225px] w-[150px] rounded-xl" />

            {/* Title placeholder. */}
            <Skeleton className="h-3 w-[70%] mx-auto" />
        </div>
    );
}

/* Horizontally scrollable row of cards with a title, icon, and loading state.
   Shows an empty state message when loading is done but no items are available. */
export function Row({ title, items, onSelect, loading, showType, icon, iconColor }) {
    return (
        <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-black dark:text-white">
                <span className={iconColor}>{icon}</span>
                {title}
            </h2>

            <div className="flex gap-2 overflow-x-auto pb-3 adaptive-scrollbar">
                {loading ? (
                    Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
                ) : items.length === 0 ? (
                    // Empty state — shown when the section has no items to display.
                    <p className="text-sm opacity-60 py-4">Nothing to show here.</p>
                ) : (
                    items.map((item) => (
                        <Card
                            key={`${item.media_type}-${item.id}`} // Compound key to avoid collisions between movies and series.
                            item={item}
                            onClick={() => onSelect(item)}
                            showType={showType}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

/* Generic card component shared across movies, series, and people.
   Adapts its badges and image source based on the item's media_type.
   Falls back to the placeholder image if the TMDB image fails to load. */
export function Card({ item, onClick, showType, showTitle = true }) {
    const [imgError, setImgError] = useState(false);
    return (
        <div onClick={onClick} className="min-w-[150px] group cursor-pointer relative">
            {/* Rating badge */}
            {item.vote_average > 0 && (
                <span className="absolute top-2 left-2 z-10 text-[11px] px-2 py-1
                                 rounded bg-black text-white flex items-center gap-1">
                    <FaStar size={11} className="text-yellow-500" />
                    <span>{item.vote_average.toFixed(1)}</span>
                </span>
            )}

            {/* Media type badge */}
            {showType && item.media_type !== "person" && (
                <span className="absolute top-2 right-2 z-10 text-[10px] px-2 py-1
                                 rounded bg-black text-white">
                    {item.media_type === "movie" ? "Movie" : "TV"}
                </span>
            )}

            {/* Use state instead of src-swap to avoid infinite onError loop. */}
            {imgError ? (
                <div className="w-full h-[225px] rounded-xl bg-zinc-200 dark:bg-zinc-700
                                flex items-center justify-center">
                    <FaFilm className="text-zinc-400" size={32} />
                </div>
            ) : (
                <img
                    src={getPoster(item.poster_path || item.profile_path)}
                    alt={item.title || item.name}
                    onError={() => setImgError(true)}
                    className="w-full h-[225px] object-cover rounded-xl
                               bg-gray-200 dark:bg-zinc-700
                               group-hover:scale-105 transition"
                />
            )}

            {showTitle && (
                <p className="mt-2 text-sm text-center line-clamp-2
                              text-black dark:text-white
                              group-hover:font-semibold transition-all">
                    {item.title || item.name}
                </p>
            )}

            {item.character && (
                <p className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400 line-clamp-1">
                    as {item.character}
                </p>
            )}
        </div>
    );
}

/* Small colored dot paired with a label — used in rating scale legends. */
export function Legend({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color}`} />
            <span>{label}</span>
        </div>
    );
}

/* Single episode cell with a tooltip showing the episode name and rating.
   Size prop controls the cell dimensions — "sm" for compact tables, "md" for full-size.
   Returns null if no episode data is provided to keep the table layout clean. */
function EpisodeCell({ ep, size = "md" }) {
    if (!ep) return null;

    // Determine cell dimensions based on the requested size variant.
    const boxSize = size === "sm" ? "w-9 h-7 text-xs" : "w-11 h-8 text-sm";

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={`${boxSize} flex items-center justify-center rounded font-semibold cursor-default ${getColor(
                            ep.vote_average
                        )}`}
                    >
                        {ep.vote_average?.toFixed(1)}
                    </div>
                </TooltipTrigger>

                {/* Tooltip content — displays episode name and its rating on hover. */}
                <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-[220px] text-xs text-center backdrop-blur-3xl p-2 rounded border bg-white/80 dark:bg-black/80 m-2"
                >
                    <div className="font-medium">{ep.name}</div>
                    <div className="opacity-70">
                        Rating: {ep.vote_average?.toFixed(1) || "N/A"}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/* Vertical episode table — episodes as rows, seasons as columns.
   Now uses EpisodeCell for all cells so tooltips and color logic are consistent
   with the horizontal table instead of duplicating raw div markup. */
export function EpisodeTable({ seasonColumns }) {
    if (!seasonColumns || seasonColumns.length === 0) return null;

    // Find the longest season to determine how many rows the table needs.
    const maxEpisodes = Math.max(
        ...seasonColumns.map((c) => c.episodes.length),
        0
    );

    return (
        <div className="overflow-x-auto mt-6">
            <table className="text-center text-sm border-collapse">
                <thead>
                    <tr>
                        {/* Empty header cell to offset the episode number column. */}
                        <th className="w-10"></th>
                        {seasonColumns.map((s, i) => (
                            <th
                                key={i}
                                className="px-1 font-medium text-gray-800 dark:text-gray-200"
                            >
                                S{s.season}
                                {/* Offset indicator shown when a season doesn't start at episode 1. */}
                                {s.offset > 0 && (
                                    <span className="ml-1 text-xs opacity-60">({s.offset + 1})</span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {Array.from({ length: maxEpisodes }).map((_, row) => (
                        <tr key={row}>
                            {/* Episode number label in the first column. */}
                            <td className="pr-2 text-xs text-gray-600 dark:text-gray-400">
                                E{row + 1}
                            </td>

                            {/* Use EpisodeCell for consistent tooltip and color behavior across both tables. */}
                            {seasonColumns.map((s, col) => (
                                <td key={col} className="px-1 py-1">
                                    <EpisodeCell ep={s.episodes[row]} size="md" />
                                </td>
                            ))}
                        </tr>
                    ))}

                    {/* Average row — shows the mean rating for each season column. */}
                    <tr>
                        <td className="pr-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            AVG
                        </td>

                        {seasonColumns.map((s, i) => (
                            <td key={i} className="px-1 py-1">
                                <div
                                    className={`w-11 h-8 flex items-center justify-center rounded font-semibold ${getColor(
                                        s.avg
                                    )}`}
                                >
                                    {s.avg?.toFixed(1) || "-"}
                                </div>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

/* Horizontal episode table — seasons as rows, episodes as columns. Uses EpisodeCell with tooltips and a sticky season label column for wide tables. */
// export function EpisodeTableHorizontal({ seasonColumns }) {
//     if (!seasonColumns || seasonColumns.length === 0) return null;

//     // Find the longest season to determine how many episode columns are needed.
//     const maxEpisodes = Math.max(
//         ...seasonColumns.map((s) => s.episodes.length),
//         0
//     );

//     return (
//         <div className="overflow-x-auto mt-6">
//             <table className="text-center text-sm border-collapse min-w-max mb-6">
//                 <thead>
//                     <tr>
//                         {/* Sticky header cell keeps the season label visible when scrolling horizontally. */}
//                         <th className="px-2 py-1 sticky left-0">Season</th>
//                         {Array.from({ length: maxEpisodes }).map((_, i) => (
//                             <th key={i} className="px-1 py-1 text-xs">
//                                 E{i + 1}
//                             </th>
//                         ))}
//                         <th className="px-2 py-1">AVG</th>
//                     </tr>
//                 </thead>

//                 <tbody>
//                     {seasonColumns.map((season, rowIdx) => (
//                         <tr key={rowIdx}>
//                             {/* Sticky season label — stays visible while scrolling through many episodes. */}
//                             <td className="px-2 py-1 font-semibold text-gray-800 dark:text-gray-200 sticky left-0">
//                                 S{season.season}
//                             </td>

//                             {/* Episode cells — renders a placeholder for missing episodes to keep columns aligned. */}
//                             {Array.from({ length: maxEpisodes }).map((_, epIdx) => (
//                                 <td key={epIdx} className="px-1 py-1">
//                                     <EpisodeCell ep={season.episodes[epIdx]} size="sm" />
//                                 </td>
//                             ))}

//                             {/* Season average cell at the end of each row. */}
//                             <td className="px-1 py-1">
//                                 <div
//                                     className={`w-10 h-8 flex items-center justify-center rounded font-semibold ${getColor(
//                                         season.avg
//                                     )}`}
//                                 >
//                                     {season.avg?.toFixed(1) || "-"}
//                                 </div>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

/* Horizontal episode table — seasons as rows, episodes as columns.
   Long seasons are split into chunks of CHUNK_SIZE episodes per row.
   Continuation chunk rows show no season label or AVG to avoid repetition. */
export function EpisodeTableHorizontal({ seasonColumns }) {
    if (!seasonColumns || seasonColumns.length === 0) return null;
    const CHUNK_SIZE = 20;
    // Build flat list of display rows — each season may span multiple rows.
    const rows = [];
    for (const season of seasonColumns) {
        const episodes = season.episodes ?? [];
        const totalChunks = Math.ceil(episodes.length / CHUNK_SIZE) || 1;

        for (let c = 0; c < totalChunks; c++) {
            rows.push({
                label: c === 0 ? `S${season.season}` : "",   // Only first chunk shows the label.
                avg: c === 0 ? season.avg : null,             // Only first chunk shows the AVG.
                chunk: episodes.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE),
            });
        }
    }

    return (
        <div className="overflow-x-auto mt-6">
            <table className="text-center text-sm border-collapse min-w-max mb-6">
                <thead>
                    <tr>
                        <th className="px-2 py-1 sticky left-0 w-10">Season</th>
                        {Array.from({ length: CHUNK_SIZE }).map((_, i) => (
                            <th key={i} className="px-1 py-1 text-xs">
                                E{i + 1}
                            </th>
                        ))}
                        <th className="px-2 py-1">AVG</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                            {/* Season label — blank for continuation rows. */}
                            <td className="px-2 py-1 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 w-10">
                                {row.label}
                            </td>

                            {/* Episode cells — pad short chunks with empty cells to keep columns aligned. */}
                            {Array.from({ length: CHUNK_SIZE }).map((_, epIdx) => (
                                <td key={epIdx} className="px-1 py-1">
                                    <EpisodeCell ep={row.chunk[epIdx]} size="sm" />
                                </td>
                            ))}

                            {/* AVG — only on the first chunk row; spacer div on continuations. */}
                            <td className="px-1 py-1">
                                {row.avg != null ? (
                                    <div className={`w-10 h-8 flex items-center justify-center rounded font-semibold ${getColor(row.avg)}`}>
                                        {row.avg.toFixed(1)}
                                    </div>
                                ) : (
                                    <div className="w-10 h-8" />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* Generic breadcrumb navigation — renders a slash-separated path of links.
   Supports two display modes:
   - Default (overlay=true): absolute positioned over a hero image with white text.
   - Inline (overlay=false): sits in the normal document flow with muted dark/light text.
   The last item is always rendered as plain bold text since it's the current page. */
export function BreadCrumbs({ paths = [], overlay = true }) {
    const wrapperClass = overlay
        ? "absolute z-10 top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-12 lg:top-8 lg:left-56 text-sm text-white/90 flex items-center gap-2 flex-wrap"
        : "flex items-center gap-1.5 text-xs text-black/50 dark:text-white/40 mb-6 flex-wrap";

    return (
        <div className={wrapperClass}>
            <button
                onClick={() => window.history.back()}
                className={overlay
                    ? "hover:underline"
                    : "hover:text-black dark:hover:text-white transition"
                }
            >
                <ArrowLeft size={16} className={` ${overlay ? "text-white/90" : "text-black/50 dark:text-white/40"} text-xs cursor-pointer`} />
            </button>
            {paths.map((item, index) => {
                const isLast = index === paths.length - 1;
                return (
                    <span key={index} className="flex items-center gap-1.5 sm:gap-2">
                        {/* Render a link for all items except the last one. */}
                        {item.to && !isLast ? (
                            <Link
                                to={item.to}
                                className={overlay
                                    ? "hover:underline"
                                    : "hover:text-black dark:hover:text-white transition"
                                }
                            >
                                {item.name}
                            </Link>
                        ) : (
                            <span className={`${isLast ? "font-semibold" : ""} ${!overlay && isLast ? "text-black dark:text-white truncate max-w-[160px] sm:max-w-xs" : ""}`}>
                                {item.name}
                            </span>
                        )}
                        {/* Separator slash — hidden after the last item. */}
                        {!isLast && (
                            <span className={overlay ? "" : "text-black/25 dark:text-white/25"}>/</span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

/* Responsive multi-line grid of cards with a title, icon, and loading state. */
export function Grid({ title, items, onSelect, loading, showType, icon, iconColor }) {
    return (
        <div className="mt-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-black dark:text-white">
                <span className={iconColor}>{icon}</span>
                {title}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                {loading
                    ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                    : items.length === 0
                        ? <p className="col-span-full text-sm opacity-60 py-4">Nothing to show here.</p>
                        : items.map((item) => (
                            <Card
                                key={`${item.media_type}-${item.id}`}
                                item={item}
                                onClick={() => onSelect(item)}
                                showType={showType}
                            />
                        ))
                }
            </div>
        </div>
    );
}

export function DetailPageSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-black animate-pulse">
            {/* Hero backdrop skeleton */}
            <div className="h-72 bg-zinc-200 dark:bg-zinc-800" />
            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-24 relative">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Poster */}
                        <div className="w-40 h-60 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                        {/* Info */}
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-700" />
                            <div className="h-4 w-4/6 rounded bg-zinc-200 dark:bg-zinc-700" />
                            {/* Action buttons */}
                            <div className="flex gap-3 pt-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-9 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EmptyState({ icon, title, subtitle, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            {/* Icon circle */}
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800
                            flex items-center justify-center mb-4">
                <span className="text-2xl">{icon}</span>
            </div>
            <h3 className="text-base font-semibold text-black dark:text-white mb-1">
                {title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                {subtitle}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-5 px-5 py-2 rounded-lg bg-black dark:bg-white
                               text-white dark:text-black text-sm font-semibold
                               hover:opacity-80 transition"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

export function AuthDivider({ text = "or" }) {
    return (
        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground tracking-wider">
                    {text}
                </span>
            </div>
        </div>
    );
}

// Custom hook for managing dropdown state with click-outside functionality.
export function useClickOutsideDropdown() {
    const [openDropdown, setOpenDropdown] = useState(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdown && !event.target.closest('.status-dropdown-container')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    return [openDropdown, setOpenDropdown];
}
