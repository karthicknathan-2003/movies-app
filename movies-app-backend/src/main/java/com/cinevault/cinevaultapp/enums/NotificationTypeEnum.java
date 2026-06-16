package com.cinevault.cinevaultapp.enums;

/**
 * Enum representing the supported in-app notification categories.
 * Used to distinguish follow events, review replies, and review likes
 * when notifications are stored and returned to the client.
 *
 * @author karthicknathan
 * @since May 28, 2026
 *
 * @version 1.0
 */
public enum NotificationTypeEnum {
    /** Notification sent when one user follows another user. */
    FOLLOW,
    /** Notification sent when a user replies to an existing review. */
    REVIEW_REPLY,
    /** Notification sent when a user likes someone else's review. */
    REVIEW_LIKE
}
