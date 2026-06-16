package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Lightweight activity row shown on the signed-in user's profile.
 * It keeps the frontend feed simple while covering the main user actions.
 */
@Data
@AllArgsConstructor
public class UserActivityDto {
    /** Stable identifier used by the frontend list renderer. */
    private String id;
    /** Activity category used for icon and copy selection. */
    private String type;
    /** Media title tied to the activity, when applicable. */
    private String title;
    /** Media identifier used for navigation from the activity feed. */
    private Long mediaId;
    /** Media type used to route to movie, series, or anime detail pages. */
    private String mediaType;
    /** Optional rating value for rating-related activities. */
    private Integer rating;
    /** Optional short review or reply preview. */
    private String contentPreview;
    /** Timestamp when the activity occurred. */
    private LocalDateTime createdAt;
}
