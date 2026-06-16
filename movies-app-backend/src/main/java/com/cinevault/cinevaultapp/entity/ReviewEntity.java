package com.cinevault.cinevaultapp.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Stores user-authored reviews and nested replies for a specific media title.
 * The same table handles both top-level reviews and replies through parentReview.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_review_media", columnList = "mediaType, mediaId"),
        @Index(name = "idx_review_parent", columnList = "parent_review_id")
})
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /**
     * TMDB media identifier. We keep the same id for movies, TV, and anime detail pages.
     */
    @Column(nullable = false)
    private Long mediaId;

    /**
     * Supported values are movie, tv, and anime.
     */
    @Column(nullable = false, length = 20)
    private String mediaType;

    @Column(nullable = false, length = 3000)
    private String content;

    /**
     * Ratings are only used on top-level reviews. Replies keep this value null.
     */
    private Integer rating;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity userEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_review_id")
    private ReviewEntity parentReview;

    @OneToMany(mappedBy = "parentReview", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @ToString.Exclude
    private List<ReviewEntity> replies = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "review_likes",
            joinColumns = @JoinColumn(name = "review_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @ToString.Exclude
    private Set<UserEntity> likedByUsers = new HashSet<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
