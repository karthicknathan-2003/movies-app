package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.UserProfileDto;
import com.cinevault.cinevaultapp.dto.UserStatsDto;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.security.JwtUtil;
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
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthServices authServices;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Get all registered users except the current authenticated user.
     *
     * @param token - JWT token from Authorization header (extracted via Spring
     *              Security)
     * @return - List of all other users with their profiles
     */
    @GetMapping
    public ResponseEntity<List<UserProfileDto>> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String token) {
        String username = extractUsernameFromToken(token);
        List<UserProfileDto> users = userService.getAllUsers(username);
        return ResponseEntity.ok(users);
    }

    /**
     * Update the profile details of the currently authenticated user.
     *
     * @param authentication - The current authenticated user.
     * @param dto            - The profile values to update.
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
     * @param token    - JWT token from Authorization header
     * @return - User profile information
     */
    @GetMapping("/{username}")
    public ResponseEntity<UserProfileDto> getUserByUsername(
            @PathVariable String username,
            @RequestHeader(value = "Authorization", required = false) String token) {
        String currentUsername = extractUsernameFromToken(token);
        UserProfileDto user = userService.getUserByUsername(username, currentUsername);
        return ResponseEntity.ok(user);
    }

    /**
     * Get statistics for a specific user (followers, following).
     *
     * @param username - The username to get stats for
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
     * @param username - The username to get followers for
     * @param token    - JWT token from Authorization header
     * @return - List of users following the specified user
     */
    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserProfileDto>> getFollowers(
            @PathVariable String username,
            @RequestHeader(value = "Authorization", required = false) String token) {
        String currentUsername = extractUsernameFromToken(token);
        List<UserProfileDto> followers = userService.getFollowers(username, currentUsername);
        return ResponseEntity.ok(followers);
    }

    /**
     * Get list of users that a specific user is following.
     *
     * @param username - The username to get following list for
     * @param token    - JWT token from Authorization header
     * @return - List of users being followed by the specified user
     */
    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserProfileDto>> getFollowing(
            @PathVariable String username,
            @RequestHeader(value = "Authorization", required = false) String token) {
        String currentUsername = extractUsernameFromToken(token);
        List<UserProfileDto> following = userService.getFollowing(username, currentUsername);
        return ResponseEntity.ok(following);
    }

    /**
     * Follow a specific user.
     *
     * @param usernameToFollow - The username of the user to follow
     * @param token            - JWT token from Authorization header
     * @return - Success response
     */
    @PostMapping("/{usernameToFollow}/follow")
    public ResponseEntity<?> followUser(
            @PathVariable String usernameToFollow,
            @RequestHeader(value = "Authorization", required = false) String token) {
        String currentUsername = extractUsernameFromToken(token);
        if (currentUsername == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        userService.followUser(currentUsername, usernameToFollow);
        return ResponseEntity.ok("Successfully followed user");
    }

    /**
     * Unfollow a specific user.
     *
     * @param usernameToUnfollow - The username of the user to unfollow
     * @param token              - JWT token from Authorization header
     * @return - Success response
     */
    @DeleteMapping("/{usernameToUnfollow}/follow")
    public ResponseEntity<?> unfollowUser(
            @PathVariable String usernameToUnfollow,
            @RequestHeader(value = "Authorization", required = false) String token) {
        String currentUsername = extractUsernameFromToken(token);
        if (currentUsername == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        userService.unfollowUser(currentUsername, usernameToUnfollow);
        return ResponseEntity.ok("Successfully unfollowed user");
    }

    /**
     * Extract username from JWT token.
     * Removes "Bearer " prefix and extracts the username claim from the token.
     *
     * @param token - The Authorization header value
     * @return - The username from the token, or null if token is invalid/missing
     */
    private String extractUsernameFromToken(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return null;
        }
        try {
            String jwt = token.substring(7);
            return jwtUtil.extractUsername(jwt);
        } catch (Exception e) {
            return null;
        }
    }
}
