import { useEffect, useMemo, useState } from "react";
import { isLoggedIn } from "@/api/authService";
import { watchlistApi } from "@/api/watchlist";

export function useWatchlistIds() {
    const [watchlistIds, setWatchlistIds] = useState([]);
    const loggedIn = isLoggedIn();

    useEffect(() => {
        if (!loggedIn) {
            return;
        }

        let ignore = false;
        const loadWatchlistIds = async () => {
            try {
                const res = await watchlistApi.get("");
                if (!ignore) {
                    const ids = Array.from(new Set((res.data ?? []).map((item) => item.movieId)));
                    setWatchlistIds(ids);
                }
            } catch {
                if (!ignore) {
                    setWatchlistIds([]);
                }
            }
        };

        loadWatchlistIds();
        return () => {
            ignore = true;
        };
    }, [loggedIn]);

    // A Set keeps repeated badge lookups fast across large grids and rows.
    return useMemo(() => new Set(loggedIn ? watchlistIds : []), [loggedIn, watchlistIds]);
}