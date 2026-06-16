package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.UserProfileDto;
import com.cinevault.cinevaultapp.dto.UserActivityDto;
import com.cinevault.cinevaultapp.dto.UserStatsDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.service.AuthServices;
import com.cinevault.cinevaultapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for handling user-related operations.
 * Provides endpoints for user browsing, following/unfollowing, and retrieving
 * user information.
 *
 * @author karthicknathan
 * @since Mar 03, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthServices authServices;
    /**
     * Get all registered users except the current authenticated user.
     *
     * @param authentication - current authenticated user when the cookie/header is present.
     *
     * @return - List of all other users with their profiles
     */
    @GetMapping
    public ResponseEntity<List<UserProfileDto>> getAllUsers(
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        List<UserProfileDto> users = userService.getAllUsers(username);
        return ResponseEntity.ok(users);
    }

    /**
     * Update the profile details of the currently authenticated user.
     *
     * @param authentication - The current authenticated user.
     * @param dto            - The profile values to update.
     *
     * @return - The updated user profile.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileDto> updateProfile(Authentication authentication,
            @RequestBody UserProfileDto dto) {
        UserProfileDto updated = userService.updateProfile(authentication.getName(), dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get the profile of the currently authenticated user.
     *
     * @param authentication - The current authenticated user.
     *
     * @return - The profile of the signed-in user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getUserByUsername(Authentication authentication) {
        UserEntity userEntity = authServices.getUser(authentication.getName());
        UserProfileDto user = UserProfileDto.fromEntity(userEntity);
        return ResponseEntity.ok(user);
    }

    /**
     * Get a specific user by username.
     *
     * @param username - The username to retrieve
     * @param authentication - current authenticated user when available
     *
     * @return - User profile information
     */
    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDto> getUserByUsername(
            @PathVariable String username,
            Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        UserProfileDto user = userService.getUserByUsername(username, currentUsername);
        return ResponseEntity.ok(user);
    }

    /**
     * Get statistics for a specific user (followers, following).
     *
     * @param username - The username to get stats for
     *
     * @return - User statistics
     */
    @GetMapping("/{username}/stats")
    public ResponseEntity<UserStatsDto> getUserStats(@PathVariable String username) {
        UserStatsDto stats = userService.getUserStats(username);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get list of followers for a specific user.
     *
     * @param username - The username to get followers for.
     * @param authentication - current authenticated user when available.
     *
     * @return - List of users following the specified user.
     */
    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserProfileDto>> getFollowers(
            @PathVariable String username,
            Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        List<UserProfileDto> followers = userService.getFollowers(username, currentUsername);
        return ResponseEntity.ok(followers);
    }

    /**
     * Get list of users that a specific user is following.
     *
     * @param username - The username to get following list for.
     * @param authentication - current authenticated user when available.
     *
     * @return - List of users being followed by the specified user.
     */
    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserProfileDto>> getFollowing(
            @PathVariable String username,
            Authentication authentication) {
        String currentUsername = authentication != null ? authentication.getName() : null;
        List<UserProfileDto> following = userService.getFollowing(username, currentUsername);
        return ResponseEntity.ok(following);
    }

    /**
     * Follow a specific user.
     *
     * @param usernameToFollow - The username of the user to follow.
     * @param authentication   - the authenticated user from the resolved JWT.
     *
     * @return - Success response.
     */
    @PostMapping("/{usernameToFollow}/follow")
    public ResponseEntity<?> followUser(
            @PathVariable String usernameToFollow,
            Authentication authentication) {
        userService.followUser(authentication.getName(), usernameToFollow);
        return ResponseEntity.ok("Successfully followed user");
    }

    /**
     * Unfollow a specific user.
     *
     * @param usernameToUnfollow - The username of the user to unfollow
     * @param authentication     - the authenticated user from the resolved JWT
     *
     * @return - Success response
     */
    @DeleteMapping("/{usernameToUnfollow}/follow")
    public ResponseEntity<?> unfollowUser(
            @PathVariable String usernameToUnfollow,
            Authentication authentication) {
        userService.unfollowUser(authentication.getName(), usernameToUnfollow);
        return ResponseEntity.ok("Successfully unfollowed user");
    }

    /**
     * Returns the signed-in user's own profile activity feed.
     *
     * @param authentication - The current authenticated user.
     *
     * @return - Reverse-chronological activity rows for the profile page.
     */
    @GetMapping("/me/activity")
    public ResponseEntity<List<UserActivityDto>> getMyActivity(Authentication authentication) {
        return ResponseEntity.ok(userService.getMyActivity(authentication.getName()));
    }
}
