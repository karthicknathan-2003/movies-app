package com.cinevault.cinevaultapp.service;

import com.cinevault.cinevaultapp.dto.CreateReviewRequestDto;
import com.cinevault.cinevaultapp.dto.ReviewAuthorDto;
import com.cinevault.cinevaultapp.dto.ReviewDto;
import com.cinevault.cinevaultapp.dto.ReviewLikeDto;
import com.cinevault.cinevaultapp.dto.UpdateReviewRequestDto;
import com.cinevault.cinevaultapp.entity.ReviewEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import com.cinevault.cinevaultapp.repository.IReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Service class for managing the application's local review system.
 * Handles review creation, editing, deletion, nested replies, and like
 * toggling for movies, TV shows, and anime entries.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Service
@Transactional
public class ReviewService {

    @Autowired
    private IReviewRepository reviewRepository;

    @Autowired
    private AuthServices authServices;

    @Autowired
    private NotificationService notificationService;

    /**
     * Loads the review tree for a title and marks whether the current user has liked each entry.
     *
     * @param mediaType - Media category from the request path.
     * @param mediaId - Identifier of the title whose reviews should be loaded.
     * @param currentUsername - Optional current user used for personalized flags.
     * @return - Review tree rooted at top-level reviews for the requested title.
     */
    @Transactional(readOnly = true)
    public List<ReviewDto> getReviews(String mediaType, Long mediaId, String currentUsername) {
        String normalizedMediaType = normalizeMediaType(mediaType);
        validateMediaId(mediaId);

        List<ReviewEntity> reviews = reviewRepository
                .findByMediaTypeAndMediaIdOrderByCreatedAtAsc(normalizedMediaType, mediaId);

        Map<Long, ReviewDto> dtoById = new LinkedHashMap<>();
        List<ReviewDto> roots = new ArrayList<>();

        for (ReviewEntity review : reviews) {
            // Build all DTOs first so reply nodes can attach to their parents in a second pass.
            dtoById.put(review.getId(), toDto(review, currentUsername));
        }

        for (ReviewEntity review : reviews) {
            ReviewDto dto = dtoById.get(review.getId());
            Long parentReviewId = review.getParentReview() != null ? review.getParentReview().getId() : null;

            if (parentReviewId == null) {
                roots.add(dto);
                continue;
            }

            ReviewDto parent = dtoById.get(parentReviewId);
            if (parent != null) {
                parent.getReplies().add(dto);
            } else {
                roots.add(dto);
            }
        }

        roots.sort(Comparator.comparing(ReviewDto::getCreatedAt).reversed());
        return roots;
    }

    /**
     * Persists a new top-level review or nested reply for the authenticated user.
     *
     * @param mediaType - Media category from the request path.
     * @param mediaId - Identifier of the title being reviewed.
     * @param username - Authenticated user creating the review.
     * @param requestDto - Review payload from the client.
     * @return - Newly created review mapped to the response DTO.
     */
    public ReviewDto createReview(String mediaType,
                                  Long mediaId,
                                  String username,
                                  CreateReviewRequestDto requestDto) {
        String normalizedMediaType = normalizeMediaType(mediaType);
        validateMediaId(mediaId);
        validateRequest(requestDto);

        UserEntity author = authServices.getUser(username);
        ReviewEntity parentReview = null;

        if (requestDto.getParentReviewId() != null) {
            parentReview = reviewRepository.findById(requestDto.getParentReviewId())
                    .orElseThrow(() -> new RuntimeException("Parent review not found"));

            if (!normalizedMediaType.equals(parentReview.getMediaType())
                    || !mediaId.equals(parentReview.getMediaId())) {
                throw new RuntimeException("Reply must target a review on the same title");
            }
        }

        ReviewEntity review = new ReviewEntity();
        review.setMediaType(normalizedMediaType);
        review.setMediaId(mediaId);
        review.setContent(requestDto.getContent().trim());
        review.setRating(parentReview == null ? normalizeRating(requestDto.getRating()) : null);
        review.setUserEntity(author);
        review.setParentReview(parentReview);

        ReviewEntity savedReview = reviewRepository.save(review);

        if (parentReview != null) {
            notificationService.notifyReviewReply(author, parentReview, savedReview);
        }

        return toDto(savedReview, username);
    }

    /**
     * Updates the current user's own review or reply.
     *
     * @param reviewId - Identifier of the review to update.
     * @param username - Authenticated user performing the update.
     * @param requestDto - Edited review payload.
     * @return - Updated review mapped to the response DTO.
     */
    public ReviewDto updateReview(Long reviewId, String username, UpdateReviewRequestDto requestDto) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("Review id must be a positive number");
        }
        if (requestDto == null) {
            throw new IllegalArgumentException("Review update payload is required");
        }
        if (requestDto.getContent() == null || requestDto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Review content is required");
        }
        if (requestDto.getContent().trim().length() > 3000) {
            throw new IllegalArgumentException("Review content must be 3000 characters or fewer");
        }

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        validateOwnership(review, username);

        String trimmedContent = requestDto.getContent().trim();
        review.setContent(trimmedContent);
        if (review.getParentReview() == null) {
            review.setRating(normalizeRating(requestDto.getRating()));
        } else {
            review.setRating(null);
        }

        return toDto(reviewRepository.save(review), username);
    }

    /**
     * Deletes the current user's own review or reply. Top-level review replies are removed with it.
     *
     * @param reviewId - Identifier of the review to delete.
     * @param username - Authenticated user performing the deletion.
     */
    public void deleteReview(Long reviewId, String username) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("Review id must be a positive number");
        }

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        validateOwnership(review, username);
        reviewRepository.delete(review);
    }

    /**
     * Toggles a like for the authenticated user and returns the updated count.
     *
     * @param reviewId - Identifier of the review being liked or unliked.
     * @param username - Authenticated user performing the action.
     * @return - Updated like state and total like count.
     */
    public ReviewLikeDto toggleLike(Long reviewId, String username) {
        if (reviewId == null || reviewId <= 0) {
            throw new IllegalArgumentException("Review id must be a positive number");
        }

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        UserEntity user = authServices.getUser(username);

        boolean liked;
        if (review.getLikedByUsers().contains(user)) {
            review.getLikedByUsers().remove(user);
            liked = false;
        } else {
            review.getLikedByUsers().add(user);
            liked = true;
            // Notify only on the transition to liked so unlike actions stay silent.
            notificationService.notifyReviewLike(user, review);
        }

        ReviewEntity saved = reviewRepository.save(review);
        return new ReviewLikeDto(liked, saved.getLikedByUsers().size());
    }

    /**
     * Validates the payload for creating a review or reply before persistence.
     *
     * @param requestDto - Incoming review payload from the controller layer.
     * @throws IllegalArgumentException - If required fields are missing or exceed allowed limits.
     */
    private void validateRequest(CreateReviewRequestDto requestDto) {
        if (requestDto == null) {
            throw new IllegalArgumentException("Review payload is required");
        }
        String trimmedContent = requestDto.getContent() != null ? requestDto.getContent().trim() : null;
        if (trimmedContent == null || trimmedContent.isEmpty()) {
            throw new IllegalArgumentException("Review content is required");
        }
        if (trimmedContent.length() > 3000) {
            throw new IllegalArgumentException("Review content must be 3000 characters or fewer");
        }
        if (requestDto.getParentReviewId() == null && requestDto.getRating() == null) {
            throw new IllegalArgumentException("A top-level review must include a rating");
        }
    }

    /**
     * Ensures the media identifier is present before querying or persisting review data.
     *
     * @param mediaId - Media identifier from the request path.
     * @throws IllegalArgumentException - If the identifier is null or non-positive.
     */
    private void validateMediaId(Long mediaId) {
        if (mediaId == null || mediaId <= 0) {
            throw new IllegalArgumentException("Media id must be a positive number");
        }
    }

    /**
     * Normalizes and validates the supported media type values for reviews.
     *
     * @param mediaType - Raw media type string from the request.
     * @return - Lowercase media type accepted by repository queries.
     * @throws IllegalArgumentException - If the media type is missing or unsupported.
     */
    private String normalizeMediaType(String mediaType) {
        if (mediaType == null || mediaType.isBlank()) {
            throw new IllegalArgumentException("Media type is required");
        }

        String normalized = mediaType.trim().toLowerCase(Locale.ROOT);
        if (!List.of("movie", "tv", "anime").contains(normalized)) {
            throw new IllegalArgumentException("Unsupported media type: " + mediaType);
        }
        return normalized;
    }

    /**
     * Validates that a review rating stays inside the supported 1-10 scale.
     *
     * @param rating - Rating supplied for a top-level review.
     * @return - The same rating when it passes validation.
     * @throws IllegalArgumentException - If the rating is outside the allowed range.
     */
    private Integer normalizeRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 10) {
            throw new IllegalArgumentException("Rating must be between 1 and 10");
        }
        return rating;
    }

    /**
     * Confirms that the current user owns the target review before editing or deleting it.
     *
     * @param review - Stored review entity being modified.
     * @param username - Username of the authenticated user.
     * @throws AccessDeniedException - If the user does not own the review.
     */
    private void validateOwnership(ReviewEntity review, String username) {
        if (!review.getUserEntity().getUserName().equals(username)) {
            throw new AccessDeniedException("You can only modify your own reviews");
        }
    }

    /**
     * Maps a review entity into the response tree node used by the frontend.
     *
     * @param review - Stored review entity.
     * @param currentUsername - Current user used to calculate like/edit flags.
     * @return - Response DTO enriched with author and interaction metadata.
     */
    private ReviewDto toDto(ReviewEntity review, String currentUsername) {
        ReviewDto dto = new ReviewDto();
        dto.setId(review.getId());
        dto.setMediaId(review.getMediaId());
        dto.setMediaType(review.getMediaType());
        dto.setParentReviewId(review.getParentReview() != null ? review.getParentReview().getId() : null);
        dto.setContent(review.getContent());
        dto.setRating(review.getRating());
        dto.setLikeCount(review.getLikedByUsers().size());
        dto.setLikedByCurrentUser(currentUsername != null && review.getLikedByUsers()
                .stream()
                .anyMatch(user -> currentUsername.equals(user.getUserName())));
        dto.setEditableByCurrentUser(currentUsername != null
                && currentUsername.equals(review.getUserEntity().getUserName()));
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());
        dto.setAuthor(toAuthorDto(review.getUserEntity()));
        return dto;
    }

    /**
     * Builds the compact author block shown beside each review in the UI.
     *
     * @param userEntity - Review author entity.
     * @return - Author summary DTO.
     */
    private ReviewAuthorDto toAuthorDto(UserEntity userEntity) {
        ReviewAuthorDto authorDto = new ReviewAuthorDto();
        authorDto.setUsername(userEntity.getUserName());
        authorDto.setFullName(userEntity.getFullName());
        authorDto.setAvatarUrl(userEntity.getAvatarUrl());
        return authorDto;
    }
}
