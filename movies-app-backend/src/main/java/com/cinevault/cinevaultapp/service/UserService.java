package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.UserProfileDto;
import com.cinevault.cinevaultapp.dto.UserStatsDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.repository.IUserRepository;
import com.cinevault.cinevaultapp.repository.IWatchlistGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service class for handling user-related operations.
 * Provides methods for user retrieval, following/unfollowing, and user
 * statistics.
 *
 * @author karthicknathan
 * @since Mar 03, 2026
 *
 * @version 1.0
 */
@Service
@Transactional
public class UserService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IWatchlistGroupRepository  watchlistGroupRepository;

    /**
     * Get all users except the current authenticated user.
     *
     * @param currentUsername - The username of the current authenticated user.
     * @return - List of UserProfileDto for all other users.
     */
    public List<UserProfileDto> getAllUsers(String currentUsername) {
        UserEntity currentUser = userRepository.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        List<UserEntity> allUsers = userRepository.findByUserNameNot(currentUsername);

        return allUsers.stream()
                .map(user -> UserProfileDto.fromEntity(user, currentUser))
                .collect(Collectors.toList());
    }

    /**
     * Update the stored profile details for a user.
     *
     * @param username - The username of the profile owner.
     * @param dto      - The new profile values to persist.
     * @return - The saved profile mapped as {@code UserProfileDto}.
     */
    @Transactional
    public UserProfileDto updateProfile(String username,
                                        UserProfileDto dto) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setBio(dto.getBio());
        user.setLocation(dto.getLocation());
        user.setAvatarUrl(dto.getAvatarUrl());
        user.setInterests(dto.getInterests());

        return UserProfileDto.fromEntity(userRepository.save(user));
    }

    /**
     * Get a user by username.
     *
     * @param username        - The username to retrieve.
     * @param currentUsername - The username of the current authenticated user (for
     *                        isFollowing check).
     * @return - UserProfileDto for the specified user.
     */
    public UserProfileDto getUserByUsername(String username, String currentUsername) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserEntity currentUser = null;
        if (currentUsername != null && !currentUsername.equals(username)) {
            currentUser = userRepository.findByUserName(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        }

        return UserProfileDto.fromEntity(user, currentUser);
    }

    /**
     * Get statistics for a user.
     *
     * @param username - The username to get stats for.
     * @return - UserStatsDto containing follower and following counts.
     */
    public UserStatsDto getUserStats(String username) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int followers = user.getFollowers() != null ? user.getFollowers().size() : 0;
        int following = user.getFollowing() != null ? user.getFollowing().size() : 0;
        int watchlistGroupCount = watchlistGroupRepository.getGroupCountByUserId(user.getId());

        return new UserStatsDto(followers, following, watchlistGroupCount);
    }

    /**
     * Get followers of a user.
     *
     * @param username        - The username to get followers for.
     * @param currentUsername - The username of the current authenticated user.
     * @return - List of UserProfileDto for the user's followers.
     */
    public List<UserProfileDto> getFollowers(String username, String currentUsername) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserEntity currentUser = null;
        if (currentUsername != null) {
            currentUser = userRepository.findByUserName(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        }

        Set<UserEntity> followers = user.getFollowers();
        if (followers == null || followers.isEmpty()) {
            return List.of();
        }

        final UserEntity finalCurrentUser = currentUser;
        return followers.stream()
                .map(follower -> UserProfileDto.fromEntity(follower, finalCurrentUser))
                .collect(Collectors.toList());
    }

    /**
     * Get the users that a user is following.
     *
     * @param username        - The username to get following list for.
     * @param currentUsername - The username of the current authenticated user.
     * @return - List of UserProfileDto for users being followed.
     */
    public List<UserProfileDto> getFollowing(String username, String currentUsername) {
        UserEntity user = userRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserEntity currentUser = null;
        if (currentUsername != null) {
            currentUser = userRepository.findByUserName(currentUsername)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        }

        Set<UserEntity> following = user.getFollowing();
        if (following == null || following.isEmpty()) {
            return List.of();
        }

        final UserEntity finalCurrentUser = currentUser;
        return following.stream()
                .map(followedUser -> UserProfileDto.fromEntity(followedUser, finalCurrentUser))
                .collect(Collectors.toList());
    }

    /**
     * Follow a user.
     *
     * @param currentUsername  - The username of the current authenticated user.
     * @param usernameToFollow - The username of the user to follow.
     */
    public void followUser(String currentUsername, String usernameToFollow) {
        if (currentUsername.equals(usernameToFollow)) {
            throw new RuntimeException("Cannot follow yourself");
        }

        UserEntity currentUser = userRepository.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        UserEntity userToFollow = userRepository.findByUserName(usernameToFollow)
                .orElseThrow(() -> new RuntimeException("User to follow not found"));

        if (!currentUser.getFollowing().contains(userToFollow)) {
            currentUser.getFollowing().add(userToFollow);
            userRepository.save(currentUser);
        }
    }

    /**
     * Unfollow a user.
     *
     * @param currentUsername    - The username of the current authenticated user.
     * @param usernameToUnfollow - The username of the user to unfollow.
     */
    public void unfollowUser(String currentUsername, String usernameToUnfollow) {
        UserEntity currentUser = userRepository.findByUserName(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        UserEntity userToUnfollow = userRepository.findByUserName(usernameToUnfollow)
                .orElseThrow(() -> new RuntimeException("User to unfollow not found"));

        if (currentUser.getFollowing().contains(userToUnfollow)) {
            currentUser.getFollowing().remove(userToUnfollow);
            userRepository.save(currentUser);
        }
    }
}
