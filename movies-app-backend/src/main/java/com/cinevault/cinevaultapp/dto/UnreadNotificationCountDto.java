package com.cinevault.cinevaultapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object for unread notification counts.
 * Used by the frontend to populate compact UI elements such as the navbar
 * badge without loading the full notification list.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@Data
@AllArgsConstructor
public class UnreadNotificationCountDto {
    /** Total unread notifications for the authenticated user. */
    private long unreadCount;
}
