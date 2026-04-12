import { useState } from "react";
import { watchlistApi } from "@/api/watchlist";

export function useWatchlist() {
  const [loading, setLoading] = useState(false);

  const addToWatchlist = async ({ id, title, favorite, mediaType }) => {
    try {
      setLoading(true);
      await watchlistApi.post("", {
        movieId: id,
        movieTitle: title,
        favorite,
        mediaType: mediaType,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (id) => {
    try {
      setLoading(true);
      await watchlistApi.delete(`/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const updateFavorite = async (id, favorite) => {
    try {
      setLoading(true);
      // Updates the favorite flag on an existing watchlist record.
      await watchlistApi.patch(`/${id}/favorite`, null, { params: { favorite } });
    } finally {
      setLoading(false);
    }
  };

  return {
    addToWatchlist,
    removeFromWatchlist,
    updateFavorite,
    loading,
  };
}
