package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.WatchListEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing {@code WatchListEntity} persistence operations.
 * Provides methods for retrieving and filtering watchlist items by user and favorite status.
 *
 * @author karthicknathan
 * @since Feb 06, 2026
 *
 * @version 1.0
 */
public interface IWatchListRepository extends JpaRepository<WatchListEntity, Long> {

    /**
     * Finds all watchlist items for a specific user.
     *
     * @param userEntity - The {@code UserEntity} whose watchlist items to retrieve.
     *
     * @return - A list of {@code WatchListEntity} objects belonging to the user.
     */
    List<WatchListEntity> findByUserEntity(UserEntity userEntity);

    /**
     * Finds all favorite watchlist items for a specific user.
     *
     * @param userEntity - The {@code UserEntity} whose favorite items to retrieve.
     *
     * @return - A list of {@code WatchListEntity} objects marked as favorite.
     */
    List<WatchListEntity> findByUserEntityAndFavoriteTrue(UserEntity userEntity);

    /**
     * Finds all non-favorite watchlist items for a specific user.
     *
     * @param userEntity - The {@code UserEntity} whose non-favorite items to retrieve.
     *
     * @return - A list of {@code WatchListEntity} objects not marked as favorite.
     */
    List<WatchListEntity> findByUserEntityAndFavoriteFalse(UserEntity userEntity);

    /**
     * Finds a specific watchlist item by user and movie ID.
     *
     * @param userEntity - The {@code UserEntity} who owns the watchlist item.
     * @param movieId - The movie/show ID to search for.
     *
     * @return - An {@code Optional} containing the {@code WatchListEntity} if found, empty otherwise.
     */
    Optional<WatchListEntity> findByUserEntityAndMovieId(UserEntity userEntity, Long movieId);
}