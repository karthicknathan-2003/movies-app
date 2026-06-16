package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.CreateReviewRequestDto;
import com.cinevault.cinevaultapp.dto.ReviewDto;
import com.cinevault.cinevaultapp.dto.ReviewLikeDto;
import com.cinevault.cinevaultapp.dto.UpdateReviewRequestDto;
import com.cinevault.cinevaultapp.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the application's local review system.
 * Exposes endpoints for reading reviews, posting top-level reviews or replies,
 * editing existing reviews, deleting owned reviews, and toggling likes.
 * Review reads are public while write operations rely on the authenticated user.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * Returns the local review tree for a movie, series, or anime title.
     *
     * @param mediaType - Media category from the request path.
     * @param mediaId - Media identifier from the request path.
     * @param authentication - Optional authentication used to calculate like/edit flags.
     * @return - Nested list of {@link ReviewDto} entries for the requested title.
     */
    @GetMapping("/{mediaType}/{mediaId}")
    public List<ReviewDto> getReviews(@PathVariable String mediaType,
                                      @PathVariable Long mediaId,
                                      Authentication authentication) {
        // Anonymous users can still read reviews, but they will not get personalized flags.
        String currentUsername = authentication != null ? authentication.getName() : null;
        return reviewService.getReviews(mediaType, mediaId, currentUsername);
    }

    /**
     * Creates a new top-level review or reply for the authenticated user.
     *
     * @param mediaType - Media category from the request path.
     * @param mediaId - Media identifier from the request path.
     * @param requestDto - Incoming review or reply payload.
     * @param authentication - Authenticated user submitting the review.
     *
     * @return - Saved {@link ReviewDto} after persistence.
     */
    @PostMapping("/{mediaType}/{mediaId}")
    public ResponseEntity<ReviewDto> createReview(@PathVariable String mediaType,
                                                  @PathVariable Long mediaId,
                                                  @RequestBody CreateReviewRequestDto requestDto,
                                                  Authentication authentication) {
        ReviewDto created = reviewService.createReview(mediaType, mediaId, authentication.getName(), requestDto);
        return ResponseEntity.ok(created);
    }

    /**
     * Toggles the current user's like state for a review or reply.
     *
     * @param reviewId - Identifier of the review being liked or unliked.
     * @param authentication - Authenticated user performing the action.
     *
     * @return - Updated like state and count for the target review.
     */
    @PostMapping("/{reviewId}/likes/toggle")
    public ResponseEntity<ReviewLikeDto> toggleLike(@PathVariable Long reviewId,
                                                    Authentication authentication) {
        ReviewLikeDto updated = reviewService.toggleLike(reviewId, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    /**
     * Updates the authenticated user's own review or reply.
     *
     * @param reviewId - Identifier of the review to update.
     * @param requestDto - Edited review payload.
     * @param authentication - Authenticated user performing the update.
     *
     * @return - Updated {@link ReviewDto} after persistence.
     */
    @PatchMapping("/{reviewId}")
    public ResponseEntity<ReviewDto> updateReview(@PathVariable Long reviewId,
                                                  @RequestBody UpdateReviewRequestDto requestDto,
                                                  Authentication authentication) {
        ReviewDto updated = reviewService.updateReview(reviewId, authentication.getName(), requestDto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes the authenticated user's own review or reply.
     *
     * @param reviewId - Identifier of the review to delete.
     * @param authentication - Authenticated user performing the deletion.
     *
     * @return - Empty {@link ResponseEntity} with no-content status when the delete succeeds.
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId,
                                             Authentication authentication) {
        reviewService.deleteReview(reviewId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
