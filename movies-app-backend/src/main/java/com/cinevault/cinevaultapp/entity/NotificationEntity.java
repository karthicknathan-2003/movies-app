package com.cinevault.cinevaultapp.entity;

import com.cinevault.cinevaultapp.enums.NotificationTypeEnum;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Stores user-facing activity notifications such as follows, review replies, and likes.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_recipient", columnList = "recipient_id, createdAt"),
        @Index(name = "idx_notification_read", columnList = "recipient_id, is_read")
})
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationTypeEnum type;

    @Column(nullable = false, length = 400)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean readStatus = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Media context lets the frontend route the user back to the relevant detail page.
     */
    private Long mediaId;

    @Column(length = 20)
    private String mediaType;

    /**
     * Review context helps the frontend scroll to or highlight the relevant thread later if needed.
     */
    private Long reviewId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private UserEntity recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private UserEntity actor;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
