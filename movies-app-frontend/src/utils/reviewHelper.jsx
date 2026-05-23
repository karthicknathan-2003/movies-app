import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

/* Avatar */
export const resolveAvatar = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/https") || path.startsWith("/http")) return path.slice(1);
    return `https://image.tmdb.org/t/p/w45${path}`;
};

/**
 * Formats an ISO date string to a short readable date.
 * e.g. "2024-03-15T12:00:00.000Z" → "Mar 15, 2024"
 */
export function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * Returns Tailwind color classes for a TMDB rating out of 10.
 * Reuses the same colour scale as getColor() so review badges match episode cells.
 */
export function getRatingColor(rating) {
    if (rating == null) return null;
    if (rating >= 9) return "bg-[#186B3A] text-white";
    if (rating >= 8) return "bg-[#28B562] text-black";
    if (rating >= 7) return "bg-[#F4D13E] text-black";
    if (rating >= 6) return "bg-[#F29D12] text-black";
    if (rating >= 5) return "bg-[#E64D3C] text-white";
    return "bg-[#633875] text-white";
}

/**
 * Strips basic HTML tags and Markdown syntax from TMDB review text.
 * TMDB review content frequently contains both, so we clean both.
 */
export function cleanContent(raw) {
    if (!raw) return "";
    return raw
        .replace(/<[^>]*>/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/_{1,2}(.*?)_{1,2}/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
}

/**
 * Circular avatar for a TMDB review author.
 * Falls back to initials when the image is missing or fails to load.
 *
 * TMDB avatar paths come in two flavours:
 *   "/https://www.gravatar.com/…"  → external URL — strip the leading slash
 *   "/abc123…"                     → TMDB CDN path — prepend the image base URL
 */
export function Avatar({ avatarPath, username, size = "md" }) {
    const [err, setErr] = useState(false);
    const src = resolveAvatar(avatarPath);
    const initials = (username ?? "?").replace(/^@/, "").slice(0, 2).toUpperCase();

    const COLORS = [
        "bg-violet-500", "bg-blue-500", "bg-emerald-500",
        "bg-rose-500", "bg-amber-500", "bg-cyan-500",
    ];
    const bg = COLORS[initials.charCodeAt(0) % COLORS.length];
    const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-9 h-9 text-xs";

    if (!src || err) {
        return (
            <div className={`${dim} ${bg} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white`}>
                {initials}
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={username}
            onError={() => setErr(true)}
            className={`${dim} rounded-full object-cover flex-shrink-0`}
        />
    );
}

/**
 * Skeleton placeholder matching the shape of a ReviewCard.
 * Uses the existing Skeleton primitive — same pattern as SkeletonCard.
 */
export function ReviewSkeleton() {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-7 w-14 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}