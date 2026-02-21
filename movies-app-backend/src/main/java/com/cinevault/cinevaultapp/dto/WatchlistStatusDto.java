package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object for watchlist status information.
 * Indicates whether a media item is in the user's watchlist and if it's marked as favorite.
 *
 * @author karthicknathan
 * @since Feb 07, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class WatchlistStatusDto {
    /**
     * Indicates whether the media item is in the user's watchlist.
     */
    private boolean isInWatchlist;

    /**
     * Indicates whether the media item is marked as a favorite.
     */
    private boolean isFavorite;
}