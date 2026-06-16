package com.cinevault.cinevaultapp.entity;

import com.cinevault.cinevaultapp.enums.WatchStatusEnum;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entity class representing a watchlist item in the database.
 * Stores information about movies or TV shows that users have added to their watchlist.
 * Items may optionally belong to a {@link WatchlistGroupEntity}.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
@Entity
@Table(name = "watchlist",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "movieId", "watchlist_group_id"}
        )
)
@Data
public class WatchListEntity {
    /**
     * The unique identifier for the watchlist item.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The TMDB ID of the movie or TV show.
     */
    private Long movieId;

    /**
     * The type of media — either "movie" or "tv".
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity userEntity;

    /**
     * The watchlist group this item belongs to.
     * Null means the item sits in the default (ungrouped) watchlist.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "watchlist_group_id")
    private WatchlistGroupEntity watchlistGroup;

    /**
     * Personal star rating saved by the user on a simple 1-5 scale.
     * Null means the user has not rated the title yet.
     */
    private Integer personalRating;

    /**
     * Timestamp when the title was first added to the user's library.
     */
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the entry was last changed, including ratings and status updates.
     */
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}