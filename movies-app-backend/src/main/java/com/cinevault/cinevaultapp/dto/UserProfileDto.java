package com.cinevault.cinevaultapp.dto;

import com.cinevault.cinevaultapp.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for user profile information.
 * Used to return user details without exposing sensitive information.
 *
 * @author karthicknathan
 * @since Mar 03, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDto {
    /**
     * The unique identifier for the user.
     */
    private Long id;

    /**
     * The user's full name.
     */
    private String fullName;

    /**
     * The unique username.
     */
    private String username;

    /**
     * Number of followers this user has.
     */
    private Integer followerCount;

    /**
     * Number of users this user is following.
     */
    private Integer followingCount;

    /**
     * Whether the current user is following this user.
     * (Set by the service based on the current user's context)
     */
    private Boolean isFollowing;

    private String firstName;
    private String lastName;
    private String bio;
    private String location;
    private String avatarUrl;
    private String interests;

    /**
     * Convert a UserEntity to UserProfileDto.
     *
     * @param user        - The UserEntity to convert.
     * @param currentUser - The current authenticated user (for isFollowing check).
     * @return - UserProfileDto with populated fields.
     */
    public static UserProfileDto fromEntity(UserEntity user, UserEntity currentUser) {
        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setUsername(user.getUserName());
        dto.setFollowerCount(user.getFollowers() != null ? user.getFollowers().size() : 0);
        dto.setFollowingCount(user.getFollowing() != null ? user.getFollowing().size() : 0);
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setInterests(user.getInterests());
        if (currentUser != null) {
            dto.setIsFollowing(currentUser.getFollowing().contains(user));
        } else {
            dto.setIsFollowing(false);
        }
        return dto;
    }

    /**
     * Convert a UserEntity to UserProfileDto without following relationship.
     *
     * @param user - The UserEntity to convert.
     * @return - UserProfileDto with populated fields.
     */
    public static UserProfileDto fromEntity(UserEntity user) {
        return fromEntity(user, null);
    }
}
