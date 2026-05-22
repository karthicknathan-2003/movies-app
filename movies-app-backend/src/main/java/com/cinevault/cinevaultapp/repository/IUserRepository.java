package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing {@code UserEntity} persistence operations.
 * Provides methods for user retrieval and existence checks by username.
 *
 * @author karthicknathan
 * @since Feb 05, 2026
 *
 * @version 1.0
 */
public interface IUserRepository extends JpaRepository<UserEntity, Long> {

    /**
     * Finds a user by their username.
     *
     * @param userName - The username to search for.
     *
     * @return - An {@code Optional} containing the {@code UserEntity} if found,
     *         empty otherwise.
     */
    Optional<UserEntity> findByUserName(String userName);

    /**
     * Checks if a user exists with the specified username.
     *
     * @param userName - The username to check.
     *
     * @return - True if a user with the username exists, false otherwise.
     */
    boolean existsByUserName(String userName);

    /**
     * Finds all users excluding the specified username.
     * Used for browsing all users except the current user.
     *
     * @param excludeUserName - The username to exclude from results.
     *
     * @return - A list of all users except the specified one.
     */
    List<UserEntity> findByUserNameNot(String excludeUserName);
}