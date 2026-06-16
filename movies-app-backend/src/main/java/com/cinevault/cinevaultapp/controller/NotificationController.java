package com.cinevault.cinevaultapp.controller;

import com.cinevault.cinevaultapp.dto.NotificationDto;
import com.cinevault.cinevaultapp.dto.UnreadNotificationCountDto;
import com.cinevault.cinevaultapp.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the authenticated user's notification inbox.
 * Provides endpoints for reading notifications, checking unread badge counts,
 * and marking one or all notifications as read.
 *
 * @author karthicknathan
 * @since May 30, 2026
 *
 * @version 1.0
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Returns the current user's notifications, newest first.
     *
     * @param authentication - Spring Security authentication for the current request.
     *
     * @return - List of {@link NotificationDto} entries for the signed-in user.
     */
    @GetMapping
    public List<NotificationDto> getNotifications(Authentication authentication) {
        // The authenticated username is the single source of truth for inbox ownership.
        return notificationService.getNotifications(authentication.getName());
    }

    /**
     * Returns the unread badge count for the navbar bell.
     *
     * @param authentication - Spring Security authentication for the current request.
     *
     * @return - Compact DTO containing the unread notification total.
     */
    @GetMapping("/unread-count")
    public UnreadNotificationCountDto getUnreadCount(Authentication authentication) {
        return new UnreadNotificationCountDto(notificationService.getUnreadCount(authentication.getName()));
    }

    /**
     * Marks one notification as read.
     *
     * @param notificationId - Identifier of the notification to update.
     * @param authentication - Spring Security authentication for the current request.
     *
     * @return - Empty {@link ResponseEntity} with no-content status when the update succeeds.
     */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long notificationId,
                                           Authentication authentication) {
        notificationService.markAsRead(notificationId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Marks the full inbox as read.
     *
     * @param authentication - Spring Security authentication for the current request.
     *
     * @return - Empty {@link ResponseEntity} with no-content status when the update succeeds.
     */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
