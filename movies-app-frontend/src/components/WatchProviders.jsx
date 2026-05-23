import { useEffect, useState } from "react";
import { tmdb } from "@/api/tmdb";
import { Skeleton } from "@/components/ui/skeleton";
import { FaPlayCircle, FaShoppingCart, FaTag } from "react-icons/fa";

/**
 * Displays streaming, rental and purchase options for a title.
 * TMDB returns a region-keyed map — we default to "IN" (India)
 * with "US" as a fallback if IN data is unavailable.
 *
 * @param {"movie"|"tv"} mediaType
 * @param {number}       id          TMDB title ID
 */
export default function WatchProviders({ mediaType, id }) {
    const [providers, setProviders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [region, setRegion] = useState("IN");

    // The available region buttons — only shown when a region has data.
    const REGIONS = ["IN", "US", "GB", "AU", "CA"];

    useEffect(() => {
        if (!id || !mediaType) return;
        let stale = false;

        const fetch = async () => {
            setLoading(true);
            try {
                const type = mediaType === "MOVIE" ? "movie" : "tv";
                const res = await tmdb.get(`/${type}/${id}/watch-providers`);
                if (!stale) setProviders(res.data?.results ?? {});
            } catch {
                if (!stale) setProviders({});
            } finally {
                if (!stale) setLoading(false);
            }
        };

        fetch();
        return () => { stale = true; };
    }, [id, mediaType]);

    if (loading) {
        return (
            <div className="mt-8">
                <Skeleton className="h-5 w-36 mb-4" />
                <div className="flex gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="w-12 h-12 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!providers) return null;

    // Available regions that actually have data
    const availableRegions = REGIONS.filter(r => providers[r]);
    if (availableRegions.length === 0) return null;

    // Pick the active region — fall back to first available
    const activeRegion = providers[region]
        ? region
        : availableRegions[0];

    const data = providers[activeRegion] ?? {};
    const streaming = data.flatrate ?? [];
    const rent = data.rent ?? [];
    const buy = data.buy ?? [];
    const link = data.link;       // JustWatch affiliate link from TMDB

    const hasAny = streaming.length + rent.length + buy.length > 0;

    if (!hasAny) return null;

    return (
        <div className="mt-6">
            {/* Section header + region switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-base font-semibold text-black dark:text-white">
                    Where to Watch
                </h3>

                {/* Region pill buttons */}
                <div className="flex items-center gap-1.5">
                    {availableRegions.map(r => (
                        <button
                            key={r}
                            onClick={() => setRegion(r)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors
                                ${activeRegion === r
                                    ? "bg-black dark:bg-white text-white dark:text-black border-transparent"
                                    : "border-black/15 dark:border-white/15 text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30"
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {/* Streaming */}
                {streaming.length > 0 && (
                    <ProviderRow
                        icon={<FaPlayCircle size={11} />}
                        label="Stream"
                        color="text-green-600 dark:text-green-400"
                        providers={streaming}
                        link={link}
                    />
                )}

                {/* Rent */}
                {rent.length > 0 && (
                    <ProviderRow
                        icon={<FaTag size={11} />}
                        label="Rent"
                        color="text-blue-600 dark:text-blue-400"
                        providers={rent}
                        link={link}
                    />
                )}

                {/* Buy */}
                {buy.length > 0 && (
                    <ProviderRow
                        icon={<FaShoppingCart size={11} />}
                        label="Buy"
                        color="text-orange-600 dark:text-orange-400"
                        providers={buy}
                        link={link}
                    />
                )}

                {/* JustWatch attribution — TMDB requires this */}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Streaming data provided by JustWatch via TMDB.
                </p>
            </div>
        </div>
    );
}

/* ProviderRow — one row per category (Stream/Rent/Buy) */
function ProviderRow({ icon, label, color, providers, link }) {
    return (
        <div className="flex items-center gap-3">
            {/* Label */}
            <div className={`flex items-center gap-1 text-xs font-semibold w-14 flex-shrink-0 ${color}`}>
                {icon}
                {label}
            </div>

            {/* Provider logo pills */}
            <div className="flex flex-wrap gap-2">
                {providers.map(p => (
                    <a
                        key={p.provider_id}
                        href={link ?? "#"}
                        target="_blank"
                        rel="noreferrer noopener"
                        title={p.provider_name}
                        className="group relative"
                    >
                        {p.logo_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                                alt={p.provider_name}
                                className="w-10 h-10 rounded-xl object-cover
                                           ring-1 ring-black/10 dark:ring-white/10
                                           group-hover:scale-110 group-hover:ring-black/30
                                           dark:group-hover:ring-white/30 transition-all duration-150"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700
                                            flex items-center justify-center text-[9px] font-bold
                                            text-zinc-600 dark:text-zinc-300">
                                {p.provider_name.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        {/* Tooltip on hover */}
                        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2
                                         bg-black dark:bg-white text-white dark:text-black
                                         text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap
                                         opacity-0 group-hover:opacity-100 transition-opacity
                                         pointer-events-none z-10">
                            {p.provider_name}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}