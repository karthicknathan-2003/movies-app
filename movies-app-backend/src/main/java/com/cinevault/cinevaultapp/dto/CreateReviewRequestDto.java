package com.cinevault.cinevaultapp.dto;

import lombok.Data;

/**
 * Data Transfer Object for creating a new review or reply.
 * Carries the review content, optional rating, and optional parent review ID
 * when the request represents a nested reply instead of a top-level review.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
public class CreateReviewRequestDto {
    /** Main review or reply text entered by the user. */
    private String content;
    /** Optional 1-10 rating used only for top-level reviews. */
    private Integer rating;
    /** Parent review identifier when the payload represents a nested reply. */
    private Long parentReviewId;
}
