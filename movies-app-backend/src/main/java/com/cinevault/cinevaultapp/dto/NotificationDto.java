package com.cinevault.cinevaultapp.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for notification responses returned to the frontend.
 * Contains the stored notification details along with optional media, review,
 * and actor information needed to render the notification feed.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
public class NotificationDto {
    /** Unique identifier of the notification row. */
    private Long id;
    /** Notification category name derived from {@code NotificationTypeEnum}. */
    private String type;
    /** Human-readable message shown in the inbox UI. */
    private String message;
    /** Whether the user has already read this notification. */
    private boolean read;
    /** Timestamp when the notification was created. */
    private LocalDateTime createdAt;
    /** Related media identifier when the notification points to a title. */
    private Long mediaId;
    /** Related media type when {@code mediaId} is present. */
    private String mediaType;
    /** Related review identifier when the notification points to a review thread. */
    private Long reviewId;
    /** Lightweight summary of the user who triggered the notification. */
    private NotificationActorDto actor;
}
