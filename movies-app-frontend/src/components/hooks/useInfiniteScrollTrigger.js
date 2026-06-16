import { useEffect, useRef } from "react";

export function useInfiniteScrollTrigger({ enabled, loading, hasMore, onLoadMore }) {
    const sentinelRef = useRef(null);
    const hasTriggeredForCurrentViewRef = useRef(false);

    useEffect(() => {
        // Unlock the next load only after the current request cycle finishes.
        if (!loading) {
            hasTriggeredForCurrentViewRef.current = false;
        }
    }, [loading]);

    useEffect(() => {
        if (!enabled || loading || !hasMore || !sentinelRef.current) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (!entry?.isIntersecting) {
                    hasTriggeredForCurrentViewRef.current = false;
                    return;
                }

                // Guard against repeated auto-loads while the sentinel remains visible.
                if (!hasTriggeredForCurrentViewRef.current) {
                    hasTriggeredForCurrentViewRef.current = true;
                    onLoadMore();
                }
            },
            { rootMargin: "300px 0px" }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [enabled, loading, hasMore, onLoadMore]);

    return sentinelRef;
}
