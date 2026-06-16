package com.cinevault.cinevaultapp.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Stores watched-episode progress for episodic media like TV series and anime.
 * Each row represents one watched episode for one user and media item.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
@Entity
@Table(
        name = "episode_progress",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"user_id", "movieId", "seasonNumber", "episodeNumber"}
        )
)
@Data
public class EpisodeProgressEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * TMDB media identifier for the show/anime this episode belongs to.
     */
    private Long movieId;

    /**
     * Media type is kept for future filtering and reporting.
     */
    private String mediaType;

    /**
     * One-based season number from the source API.
     */
    private Integer seasonNumber;

    /**
     * One-based episode number inside the season.
     */
    private Integer episodeNumber;

    /**
     * Cached episode name so the frontend can show progress without another lookup.
     */
    private String episodeName;

    /**
     * Episode runtime in minutes, captured when the user marks it watched.
     */
    private Integer runtimeMinutes;

    /**
     * Timestamp used for simple ordering and future "recently watched" displays.
     */
    private LocalDateTime watchedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity userEntity;
}
