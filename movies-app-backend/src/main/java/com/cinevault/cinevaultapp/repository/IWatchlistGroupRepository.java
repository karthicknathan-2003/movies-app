package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.entity.WatchlistGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link WatchlistGroupEntity}.
 * Provides query methods for watchlist group management.
 *
 * @author karthicknathan
 * @since Mar 2026
 *
 * @version 1.0
 */
public interface IWatchlistGroupRepository extends JpaRepository<WatchlistGroupEntity, Long> {

    /**
     * Retrieves all watchlist groups belonging to a specific user.
     *
     * @param user - The owner {@link UserEntity}.
     *
     * @return - List of watchlist groups owned by the user.
     */
    List<WatchlistGroupEntity> findByUserEntity(UserEntity user);

    /**
     * Finds a specific watchlist group by ID and owner.
     * Used to enforce ownership before mutations.
     *
     * @param id   - The group ID.
     * @param user - The owner {@link UserEntity}.
     *
     * @return - Optional containing the group if found and owned by the user.
     */
    Optional<WatchlistGroupEntity> findByIdAndUserEntity(Long id, UserEntity user);

    /**
     * Returns the total number of watchlist groups created by a user.
     *
     * Since your entity field is named 'userEntity',
     * JPQL must use that exact property name.
     *
     * @param userId the user ID
     * @return total watchlist group count
     */
    @Query("""
       SELECT COUNT(wg)
       FROM WatchlistGroupEntity wg
       WHERE wg.userEntity.id = :userId
       """)
    int getGroupCountByUserId(@Param("userId") Long userId);
}