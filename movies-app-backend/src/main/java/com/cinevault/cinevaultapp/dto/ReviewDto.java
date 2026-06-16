package com.cinevault.cinevaultapp.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object for review responses returned to the frontend.
 * Represents both top-level reviews and nested replies, including author
 * details, like state, edit permissions, and child reply nodes.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
public class ReviewDto {
    /** Unique identifier of the review or reply. */
    private Long id;
    /** Media identifier that the review belongs to. */
    private Long mediaId;
    /** Media type associated with the review target. */
    private String mediaType;
    /** Parent review identifier when this DTO represents a nested reply. */
    private Long parentReviewId;
    /** Review or reply text entered by the user. */
    private String content;
    /** Optional 1-10 rating stored for top-level reviews. */
    private Integer rating;
    /** Current total likes for the review. */
    private int likeCount;
    /** Whether the current signed-in user has liked this review. */
    private boolean likedByCurrentUser;
    /** Whether the current signed-in user is allowed to edit this review. */
    private boolean editableByCurrentUser;
    /** Timestamp when the review was first created. */
    private LocalDateTime createdAt;
    /** Timestamp when the review was last updated. */
    private LocalDateTime updatedAt;
    /** Lightweight author information for rendering the review card. */
    private ReviewAuthorDto author;
    /** Child replies attached under this review node. */
    private List<ReviewDto> replies = new ArrayList<>();
}
