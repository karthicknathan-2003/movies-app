package com.cinevault.cinevaultapp.dto;

import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object for watchlist items.
 * Contains media information and user-specific watchlist metadata.
 *
 * @author karthicknathan
 * @since Feb 07, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class WatchListDto {
    /**
     * The unique identifier of the movie or TV show.
     */
    private Long movieId;

    /**
     * The title of the movie or TV show.
     */
    private String movieTitle;

    /**
     * Indicates whether the item is marked as a favorite.
     */
    private boolean favorite;

    /**
     * The path to the media's poster image.
     */
    private String posterPath;

    /**
     * The path to the media's backdrop image.
     */
    private String backdropPath;

    /**
     * The type of media - either "movie" or "tv".
     */
    private String mediaType;

    /**
     * The current watch status of the item.
     */
    private WatchStatusEnum status;

    /**
     * List of genre names associated with the media.
     */
    private List<String> genres;
}