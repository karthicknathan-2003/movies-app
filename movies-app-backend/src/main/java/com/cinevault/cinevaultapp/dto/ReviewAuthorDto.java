package com.cinevault.cinevaultapp.dto;

import lombok.Data;

/**
 * Data Transfer Object for the author information attached to a review.
 * Contains a lightweight user summary that is safe to expose in review and
 * reply responses without returning the full user profile object.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
public class ReviewAuthorDto {
    /** Username of the review author. */
    private String username;
    /** Display name shown alongside the review. */
    private String fullName;
    /** Avatar image URL for the review author. */
    private String avatarUrl;
}
