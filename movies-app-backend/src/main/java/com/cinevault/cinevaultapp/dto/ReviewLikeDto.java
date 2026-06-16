package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object returned after toggling a review like.
 * Communicates whether the current user now likes the review and the latest
 * total like count that should be shown in the UI.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class ReviewLikeDto {
    /** Whether the current user now likes the review after the toggle. */
    private boolean liked;
    /** Updated total number of likes for the review. */
    private int likeCount;
}
