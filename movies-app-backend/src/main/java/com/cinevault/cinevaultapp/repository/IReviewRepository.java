package com.cinevault.cinevaultapp.repository;

import com.cinevault.cinevaultapp.entity.ReviewEntity;
import com.cinevault.cinevaultapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository interface for managing {@link ReviewEntity} persistence operations.
 * Provides query methods for loading local reviews and replies associated with
 * a specific media title.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
public interface IReviewRepository extends JpaRepository<ReviewEntity, Long> {

    /**
     * Returns every review and reply for a media item in chronological order.
     * The service rebuilds the nested reply tree from this flat list.
     *
     * @param mediaType - Normalized media type used to scope the review lookup.
     * @param mediaId - Identifier of the movie, series, or anime title.
     *
     * @return - List of matching {@link ReviewEntity} rows ordered by creation time.
     */
    List<ReviewEntity> findByMediaTypeAndMediaIdOrderByCreatedAtAsc(String mediaType, Long mediaId);

    /**
     * Returns every review and reply authored by a specific user, newest first.
     *
     * @param user - Review author.
     *
     * @return - List of authored review rows ordered by creation time descending.
     */
    List<ReviewEntity> findByUserEntityOrderByCreatedAtDesc(UserEntity user);
}
