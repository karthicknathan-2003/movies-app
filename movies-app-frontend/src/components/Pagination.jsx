import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * Pagination component.
 *
 * Renders a compact prev / numbered-pages / next control.
 * Pages beyond the visible window are collapsed into ellipsis markers so the
 * control stays readable at any total page count.
 *
 * @param {number}   page          - Currently active page (1-indexed).
 * @param {number}   totalPages    - Total number of pages available.
 * @param {Function} onPageChange  - Callback invoked with the new page number.
 */
export default function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    // Build the visible page numbers with ellipsis markers ("...").
    const buildPages = () => {
        const delta = 2; // Pages shown on each side of the current page.
        const range = [];
        const rangeWithDots = [];

        // Always include first and last, plus a window around the current page.
        const left = Math.max(2, page - delta);
        const right = Math.min(totalPages - 1, page + delta);

        range.push(1);
        for (let i = left; i <= right; i++) range.push(i);
        if (totalPages > 1) range.push(totalPages);

        // Insert "..." wherever there are gaps between consecutive numbers.
        let prev;
        for (const p of range) {
            if (prev !== undefined) {
                if (p - prev === 2) {
                    rangeWithDots.push(prev + 1); // Single gap — just show the missing number.
                } else if (p - prev > 2) {
                    rangeWithDots.push("...");
                }
            }
            rangeWithDots.push(p);
            prev = p;
        }

        return rangeWithDots;
    };

    const pages = buildPages();

    const btnBase =
        "h-8 min-w-[2rem] px-2 rounded text-sm font-medium transition flex items-center justify-center select-none";
    const active =
        "bg-black text-white dark:bg-white dark:text-black";
    const inactive =
        "bg-gray-100 dark:bg-[#1e1e1e] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#2a2a2a]";
    const disabled =
        "opacity-30 pointer-events-none bg-gray-100 dark:bg-[#1e1e1e] text-black dark:text-white";

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {/* Previous */}
            <button
                onClick={() => onPageChange(page - 1)}
                className={`${btnBase} ${page === 1 ? disabled : inactive}`}
                aria-label="Previous page"
            >
                <FaChevronLeft size={11} />
            </button>

            {/* Page numbers + ellipsis */}
            {pages.map((p, i) =>
                p === "..." ? (
                    <span
                        key={`dots-${i}`}
                        className="h-8 min-w-[2rem] px-1 flex items-center justify-center text-sm text-black/40 dark:text-white/40 select-none"
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`${btnBase} ${p === page ? active : inactive}`}
                        aria-current={p === page ? "page" : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Next */}
            <button
                onClick={() => onPageChange(page + 1)}
                className={`${btnBase} ${page === totalPages ? disabled : inactive}`}
                aria-label="Next page"
            >
                <FaChevronRight size={11} />
            </button>
        </div>
    );
}