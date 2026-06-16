package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.EpisodeProgressEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing {@link EpisodeProgressEntity} persistence operations.
 * Provides query methods for loading and updating per-episode watch progress
 * for episodic titles such as TV series and anime.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
public interface IEpisodeProgressRepository extends JpaRepository<EpisodeProgressEntity, Long> {

    /**
     * Retrieves every episode progress row stored for a user.
     *
     * @param user - User whose episode progress should be loaded.
     *
     * @return - List of all {@link EpisodeProgressEntity} rows owned by the user.
     */
    List<EpisodeProgressEntity> findByUserEntity(UserEntity user);

    /**
     * Retrieves episode progress for a single title ordered by season and episode number.
     *
     * @param user - User who owns the progress rows.
     * @param movieId - Identifier of the title whose progress should be loaded.
     *
     * @return - Ordered list of episode progress rows for the title.
     */
    List<EpisodeProgressEntity> findByUserEntityAndMovieIdOrderBySeasonNumberAscEpisodeNumberAsc(
            UserEntity user, Long movieId
    );

    /**
     * Finds one episode progress row for a specific user, title, season, and episode.
     *
     * @param user - User who owns the progress row.
     * @param movieId - Identifier of the title the episode belongs to.
     * @param seasonNumber - One-based season number of the episode.
     * @param episodeNumber - One-based episode number within the season.
     *
     * @return - Optional containing the matching {@link EpisodeProgressEntity} when present.
     */
    Optional<EpisodeProgressEntity> findByUserEntityAndMovieIdAndSeasonNumberAndEpisodeNumber(
            UserEntity user, Long movieId, Integer seasonNumber, Integer episodeNumber
    );
}
