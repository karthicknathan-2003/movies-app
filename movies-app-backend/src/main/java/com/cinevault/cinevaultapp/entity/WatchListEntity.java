package com.cinevault.cinevaultapp.entity;

import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity class representing a watchlist item in the database.
 * Stores information about movies or TV shows that users have added to their watchlist.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Entity
@Table(name = "watchlist")
@Data
public class WatchListEntity {
    /**
     * The unique identifier for the watchlist item.
     */
    @Id
    @GeneratedValue
    private Long id;

    /**
     * The TMDB ID of the movie or TV show.
     */
    private Long movieId;

    /**
     * The type of media - either "movie" or "tv".
     */
    private String mediaType;

    /**
     * The title of the movie or TV show.
     */
    private String movieTitle;

    /**
     * Indicates whether the item is marked as a favorite.
     */
    private boolean favorite;

    /**
     * The current watch status of the item.
     * Defaults to {@code PLANNED} if not specified.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WatchStatusEnum watchStatus = WatchStatusEnum.PLANNED;

    /**
     * The user who owns this watchlist item.
     */
    @ManyToOne
    private UserEntity userEntity;
}