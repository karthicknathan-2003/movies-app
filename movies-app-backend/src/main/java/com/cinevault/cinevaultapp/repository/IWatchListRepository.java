package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.entity.WatchListEntity;
import com.cinevault.cinevaultapp.entity.WatchlistGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link WatchListEntity}.
 *
 * @author karthicknathan
 * @since Feb 04, 2026
 *
 * @version 1.0
 */
public interface IWatchListRepository extends JpaRepository<WatchListEntity, Long> {

    /**
     * Finds a watchlist item by its owner and TMDB movie ID.
     *
     * @param user    - The owner {@link UserEntity}.
     * @param movieId - The TMDB ID of the media item.
     *
     * @return - Optional containing the entity if found.
     */
    Optional<WatchListEntity> findByUserEntityAndMovieId(UserEntity user, Long movieId);

    /**
     * Retrieves all watchlist items belonging to a specific user.
     *
     * @param user - The owner {@link UserEntity}.
     *
     * @return - List of all watchlist items for the user.
     */
    List<WatchListEntity> findByUserEntity(UserEntity user);

    /**
     * Retrieves all watchlist items belonging to a specific group.
     *
     * @param group - The {@link WatchlistGroupEntity} to query.
     *
     * @return - List of watchlist items in the given group.
     */
    List<WatchListEntity> findByWatchlistGroup(WatchlistGroupEntity group);

    /**
     * Finds a watchlist item by its owner, TMDB movie ID, and group.
     * Used to prevent duplicate entries within the same group.
     *
     * @param user    - The owner {@link UserEntity}.
     * @param movieId - The TMDB ID of the media item.
     * @param group   - The target {@link WatchlistGroupEntity}.
     *
     * @return - Optional containing the entity if a duplicate exists.
     */
    Optional<WatchListEntity> findByUserEntityAndMovieIdAndWatchlistGroup(
            UserEntity user, Long movieId, WatchlistGroupEntity group);
}