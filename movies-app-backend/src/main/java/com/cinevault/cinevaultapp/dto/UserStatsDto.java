package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for user statistics.
 * Contains aggregate information about a user's followers and following.
 *
 * @author karthicknathan
 * @since Mar 03, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserStatsDto {
    /**
     * Number of followers this user has.
     */
    private Integer followers;

    /**
     * Number of users this user is following.
     */
    private Integer following;

    private Integer watchlistGroupCount;
}
