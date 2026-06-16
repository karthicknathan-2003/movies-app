package com.cinevault.cinevaultapp.dto;

import lombok.Data;

/**
 * Data Transfer Object for updating an existing review or reply.
 * Contains the edited review text and, for top-level reviews, the updated
 * rating value that should be stored with the review.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
public class UpdateReviewRequestDto {
    /** Edited review or reply content. */
    private String content;
    /** Updated 1-10 rating for top-level reviews. */
    private Integer rating;
}
