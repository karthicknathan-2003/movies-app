package com.cinevault.cinevaultapp.dto;

import lombok.Data;

/**
 * Data Transfer Object for the actor attached to a notification response.
 * Provides a lightweight summary of the user who triggered the notification,
 * including identity and avatar information for UI display.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
public class NotificationActorDto {
    /** Username of the user who triggered the notification. */
    private String username;
    /** Display name shown in the notification UI. */
    private String fullName;
    /** Avatar image URL used beside the notification text. */
    private String avatarUrl;
}
